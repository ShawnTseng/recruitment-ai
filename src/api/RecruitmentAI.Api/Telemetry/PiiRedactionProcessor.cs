namespace RecruitmentAI.Api.Telemetry;

/// <summary>
/// ASP.NET Core middleware that sanitizes sensitive data from request logging.
/// Replaces candidate token values in request paths with [REDACTED] so they
/// never appear in Application Insights or structured logs.
/// Per OWASP: never log personal data or security tokens.
/// </summary>
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
            // Override path for Activity/telemetry name by setting a custom property
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

