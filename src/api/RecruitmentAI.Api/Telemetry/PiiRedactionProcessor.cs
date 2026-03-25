namespace RecruitmentAI.Api.Telemetry;

public sealed class PiiSanitizerMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<PiiSanitizerMiddleware> _logger;

    public PiiSanitizerMiddleware(RequestDelegate next, ILogger<PiiSanitizerMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Log a sanitized path — replace token segment with [REDACTED]
        if (context.Request.Path.StartsWithSegments("/api/submissions/by-token", StringComparison.OrdinalIgnoreCase))
        {
            context.Items["SanitizedPath"] = "/api/submissions/by-token/[REDACTED]";
        }

        await _next(context);
    }
}

public static class PiiSanitizerMiddlewareExtensions
{
    public static IApplicationBuilder UsePiiSanitizer(this IApplicationBuilder app)
        => app.UseMiddleware<PiiSanitizerMiddleware>();
}

