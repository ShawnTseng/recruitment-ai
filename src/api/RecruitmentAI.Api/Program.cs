using Azure.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.SemanticKernel;
using RecruitmentAI.Core.Interfaces;
using RecruitmentAI.Infrastructure.Data;
using RecruitmentAI.Infrastructure.Repositories;
using RecruitmentAI.Infrastructure.Services;
using RecruitmentAI.Plugins;

var builder = WebApplication.CreateBuilder(args);

// -- Azure Key Vault Configuration -------------------------------------------
var keyVaultUri = builder.Configuration["KeyVault:Uri"];
if (!string.IsNullOrEmpty(keyVaultUri))
{
    builder.Configuration.AddAzureKeyVault(new Uri(keyVaultUri), new DefaultAzureCredential());
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
builder.Services.AddScoped<IEvaluationReportRepository, EvaluationReportRepository>();
builder.Services.AddScoped<IInterviewGuideRepository, InterviewGuideRepository>();
builder.Services.AddScoped<IClientFeedbackRepository, ClientFeedbackRepository>();
builder.Services.AddScoped<IBlobStorageService, AzureBlobStorageService>();

// -- Blob Storage ------------------------------------------------------------
var blobEndpoint = builder.Configuration["BlobStorage:Endpoint"];
if (!string.IsNullOrEmpty(blobEndpoint))
{
    builder.Services.AddSingleton(new Azure.Storage.Blobs.BlobServiceClient(new Uri(blobEndpoint), new DefaultAzureCredential()));
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
builder.Services.AddApplicationInsightsTelemetry();

// -- Controllers & Swagger ---------------------------------------------------
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

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
    .AddDbContextCheck<RecruitmentDbContext>();

var app = builder.Build();

// -- Middleware ---------------------------------------------------------------
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("AllowFrontend");
app.MapControllers();
app.MapHealthChecks("/health");

app.Run();

// Make Program class accessible for integration tests
public partial class Program { }
