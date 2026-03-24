using Azure.Identity;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.SemanticKernel;
using RecruitmentAI.Api.Telemetry;
using RecruitmentAI.Core.Entities;
using RecruitmentAI.Core.Interfaces;
using RecruitmentAI.Infrastructure.Data;
using RecruitmentAI.Infrastructure.Repositories;
using RecruitmentAI.Infrastructure.Services;
using RecruitmentAI.Plugins;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// -- Azure Key Vault Configuration -------------------------------------------
// In Azure App Service, secrets are injected via Key Vault References in App Settings
// (set in Bicep). AddAzureKeyVault is only used for local dev where KV is reachable
// via Azure CLI credentials. In production, this block is skipped via ASPNETCORE_ENVIRONMENT.
if (builder.Environment.IsDevelopment())
{
    var keyVaultUri = builder.Configuration["KeyVault:Uri"];
    if (!string.IsNullOrEmpty(keyVaultUri) && Uri.TryCreate(keyVaultUri, UriKind.Absolute, out var kvUri))
    {
        builder.Configuration.AddAzureKeyVault(kvUri, new DefaultAzureCredential());
    }
}

// -- Database ----------------------------------------------------------------
builder.Services.AddDbContext<RecruitmentDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// -- Repositories ------------------------------------------------------------
builder.Services.AddScoped<IJobDescriptionRepository, JobDescriptionRepository>();
builder.Services.AddScoped<ICandidateRepository, CandidateRepository>();
builder.Services.AddScoped<ICandidateSubmissionRepository, CandidateSubmissionRepository>();
builder.Services.AddScoped<IQuestionnaireRepository, QuestionnaireRepository>();
builder.Services.AddScoped<IRecruiterRepository, RecruiterRepository>();
builder.Services.AddScoped<IClientRepository, ClientRepository>();
builder.Services.AddScoped<IEvaluationReportRepository, EvaluationReportRepository>();
builder.Services.AddScoped<IInterviewGuideRepository, InterviewGuideRepository>();
builder.Services.AddScoped<IClientFeedbackRepository, ClientFeedbackRepository>();
builder.Services.AddScoped<ISystemParameterRepository, SystemParameterRepository>();
builder.Services.AddScoped<ITalentPoolRepository, TalentPoolRepository>();
builder.Services.AddScoped<IBlobStorageService, AzureBlobStorageService>();

// -- Blob Storage ------------------------------------------------------------
var blobEndpoint = builder.Configuration["BlobStorage:Endpoint"];
if (!string.IsNullOrEmpty(blobEndpoint))
{
    builder.Services.AddSingleton(new Azure.Storage.Blobs.BlobServiceClient(new Uri(blobEndpoint), new DefaultAzureCredential()));
}
else
{
    // Fallback: register null client so DI doesn't fail; upload endpoints will return 503
    builder.Services.AddSingleton<Azure.Storage.Blobs.BlobServiceClient>(_ => null!);
}

// -- Semantic Kernel ---------------------------------------------------------
var aoaiEndpoint = builder.Configuration["AzureOpenAI:Endpoint"];
var aoaiDeployment = builder.Configuration["AzureOpenAI:DeploymentName"] ?? "gpt-4o";
if (!string.IsNullOrEmpty(aoaiEndpoint))
{
    builder.Services.AddSingleton(sp =>
    {
        var kernelBuilder = Kernel.CreateBuilder();
        kernelBuilder.AddAzureOpenAIChatCompletion(aoaiDeployment, aoaiEndpoint, new DefaultAzureCredential());
        kernelBuilder.Plugins.AddFromType<JdParserPlugin>();
        kernelBuilder.Plugins.AddFromType<QaGeneratorPlugin>();
        kernelBuilder.Plugins.AddFromType<AnswerEvaluatorPlugin>();
        kernelBuilder.Plugins.AddFromType<ReportGeneratorPlugin>();
        return kernelBuilder.Build();
    });
}
else
{
    // Development fallback — Kernel without AI backend (plugins return stubs)
    builder.Services.AddSingleton(_ => new Kernel());
}

// -- Application Insights ----------------------------------------------------
var aiConnStr = builder.Configuration["ApplicationInsights:ConnectionString"];
if (!string.IsNullOrEmpty(aiConnStr))
{
    builder.Services.AddApplicationInsightsTelemetry();
}

// -- Controllers & Swagger ---------------------------------------------------
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "RecruitmentAI API", Version = "v1" });
});

// -- Authentication & Authorization ----------------------------------------
var jwtSecret = builder.Configuration["Jwt:SecretKey"];
if (string.IsNullOrWhiteSpace(jwtSecret))
    throw new InvalidOperationException("Jwt:SecretKey is not configured. Set it in appsettings, user-secrets, or Key Vault.");
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ValidateIssuer = false,
            ValidateAudience = false,
            ClockSkew = TimeSpan.Zero,
        };
    });
builder.Services.AddAuthorization();

// -- CORS --------------------------------------------------------------------
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
                builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? ["http://localhost:5173"])
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

// -- Health Checks -----------------------------------------------------------
builder.Services.AddHealthChecks()
    .AddDbContextCheck<RecruitmentDbContext>("database", tags: ["ready"]);

var app = builder.Build();

// -- Auto-migrate DB on startup ----------------------------------------------
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<RecruitmentDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    try
    {
        db.Database.Migrate();

        // Seed default users on first deploy
        if (!db.AppUsers.Any())
        {
            var recruiterWsId = Guid.NewGuid();
            db.AppUsers.AddRange([
                new AppUser { Id = Guid.NewGuid(), Username = "admin",        PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@2026#"),    DisplayName = "Administrator",   Role = "SuperAdmin" },
                new AppUser { Id = Guid.NewGuid(), Username = "recruiter1",   PasswordHash = BCrypt.Net.BCrypt.HashPassword("RecAI@2026#"),     DisplayName = "India Recruiter", Role = "Recruiter",     WorkspaceId = recruiterWsId },
                new AppUser { Id = Guid.NewGuid(), Username = "interviewer1", PasswordHash = BCrypt.Net.BCrypt.HashPassword("InterAI@2026#"),   DisplayName = "TW Interviewer",  Role = "Interviewer" },
                new AppUser { Id = Guid.NewGuid(), Username = "manager1",     PasswordHash = BCrypt.Net.BCrypt.HashPassword("MgrAI@2026#"),     DisplayName = "Manager",         Role = "Manager" },
                new AppUser { Id = Guid.NewGuid(), Username = "am1",          PasswordHash = BCrypt.Net.BCrypt.HashPassword("AcctAI@2026#"),    DisplayName = "Account Manager", Role = "AccountManager" },
            ]);
            // Seed matching Recruiter record (Id == WorkspaceId for simplicity)
            db.Recruiters.Add(new Recruiter
            {
                Id = recruiterWsId,
                Name = "India Recruiter",
                Email = "recruiter1@company.com",
                WorkspaceId = recruiterWsId,
            });
            db.SaveChanges();
        }

        // Auto-provision Recruiter records for any Recruiter AppUsers that don't have one yet
        // (handles existing deployments where Recruiter table was empty)
        var recruiterUsers = db.AppUsers
            .Where(u => u.Role == "Recruiter" && u.WorkspaceId.HasValue)
            .ToList();
        foreach (var ru in recruiterUsers)
        {
            if (!db.Recruiters.Any(r => r.WorkspaceId == ru.WorkspaceId!.Value))
            {
                db.Recruiters.Add(new Recruiter
                {
                    Id = ru.WorkspaceId!.Value,
                    Name = ru.DisplayName,
                    Email = $"{ru.Username}@company.com",
                    WorkspaceId = ru.WorkspaceId!.Value,
                });
            }
        }
        db.SaveChanges();
    }
    catch (Exception ex)
    {
        // Log but don't crash — app can still serve non-DB endpoints
        // and health check will report unhealthy until DB is reachable.
        logger.LogError(ex, "Database migration failed on startup. The app will continue, but DB-dependent endpoints may fail.");
    }
}

// -- Middleware ---------------------------------------------------------------
app.UseSwagger();
app.UseSwaggerUI();

app.UseHttpsRedirection();
app.UsePiiSanitizer();
app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers().RequireAuthorization();

// Liveness: always OK if container is running (used by App Service to detect crashes)
app.MapHealthChecks("/health", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
{
    Predicate = _ => false // exclude all registered checks — just return Healthy
}).AllowAnonymous();

// Readiness: includes DB check (used by probes / monitoring, not by App Service startup)
app.MapHealthChecks("/health/ready", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
{
    Predicate = check => check.Tags.Contains("ready")
}).AllowAnonymous();

app.Run();

// Make Program class accessible for integration tests
public partial class Program { }
