using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.SemanticKernel;
using RecruitmentAI.Core.DTOs;
using RecruitmentAI.Core.Entities;
using RecruitmentAI.Core.Interfaces;
using RecruitmentAI.Infrastructure.Services;
using RecruitmentAI.Plugins;

namespace RecruitmentAI.Api.Controllers;

[ApiController]
[Route("api/job-descriptions")]
[Authorize]
public class JobDescriptionsController : ControllerBase
{
    private readonly IJobDescriptionRepository _jdRepo;
    private readonly IRecruiterRepository _recruiterRepo;
    private readonly Kernel _kernel;
    private readonly ILogger<JobDescriptionsController> _logger;

    public JobDescriptionsController(
        IJobDescriptionRepository jdRepo,
        IRecruiterRepository recruiterRepo,
        Kernel kernel,
        ILogger<JobDescriptionsController> logger)
    {
        _jdRepo = jdRepo;
        _recruiterRepo = recruiterRepo;
        _kernel = kernel;
        _logger = logger;
    }

    private static JobDescriptionResponse ToResponse(JobDescription jd) =>
        new(jd.Id, jd.RecruiterId, jd.ClientId, jd.Client?.Name, jd.Title, jd.BlobUrl, jd.ParsedJson, jd.PromptVersion, jd.CreatedAt);

    /// <summary>Resolves the RecruiterId for the calling Recruiter from the JWT workspaceId claim.
    /// If no Recruiter row exists yet, auto-provisions one.</summary>
    private async Task<Guid?> ResolveRecruiterIdAsync(CancellationToken ct)
    {
        var workspaceIdStr = User.FindFirstValue("workspaceId");
        if (!Guid.TryParse(workspaceIdStr, out var workspaceId)) return null;

        var recruiter = await _recruiterRepo.GetByWorkspaceIdAsync(workspaceId, ct);
        if (recruiter is null)
        {
            recruiter = new Recruiter
            {
                Id = workspaceId,
                Name = User.FindFirstValue("displayName") ?? "Recruiter",
                Email = User.FindFirstValue(ClaimTypes.Email) ?? $"{User.FindFirstValue(JwtRegisteredClaimNames.UniqueName)}@company.com",
                WorkspaceId = workspaceId,
            };
            await _recruiterRepo.AddAsync(recruiter, ct);
        }
        return recruiter.Id;
    }

    /// <summary>GET /api/job-descriptions — returns JDs for the calling recruiter (or by clientId filter)</summary>
    [HttpGet]
    [Authorize(Roles = "Recruiter,SuperAdmin")]
    public async Task<IActionResult> GetByRecruiter([FromQuery] Guid? clientId, CancellationToken ct)
    {
        var recruiterId = await ResolveRecruiterIdAsync(ct);
        if (recruiterId is null) return Forbid();

        IReadOnlyList<JobDescription> jds;
        if (clientId.HasValue)
            jds = await _jdRepo.GetByClientAsync(clientId.Value, recruiterId.Value, ct);
        else
            jds = await _jdRepo.GetByRecruiterAsync(recruiterId.Value, ct);

        return Ok(jds.Select(ToResponse));
    }

    /// <summary>GET /api/job-descriptions/{id}</summary>
    [HttpGet("{id:guid}")]
    [Authorize(Roles = "Recruiter,Interviewer,Manager,SuperAdmin")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var jd = await _jdRepo.GetByIdAsync(id, ct);
        if (jd is null) return NotFound();
        return Ok(ToResponse(jd));
    }

    /// <summary>POST /api/job-descriptions — Create JD with raw text</summary>
    [HttpPost]
    [Authorize(Roles = "Recruiter,SuperAdmin")]
    public async Task<IActionResult> Create([FromBody] CreateJobDescriptionRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
            return BadRequest(new { message = "Title is required." });
        if (string.IsNullOrWhiteSpace(request.RawText))
            return BadRequest(new { message = "Job description text is required." });

        var recruiterId = await ResolveRecruiterIdAsync(ct);
        if (recruiterId is null) return Forbid();

        var jd = new JobDescription
        {
            Id = Guid.NewGuid(),
            RecruiterId = recruiterId.Value,
            ClientId = request.ClientId,
            Title = request.Title,
            RawText = request.RawText,
        };

        await _jdRepo.AddAsync(jd, ct);
        _logger.LogInformation("JD created: {JdId} for recruiter {RecruiterId}", jd.Id, recruiterId);
        return CreatedAtAction(nameof(GetById), new { id = jd.Id }, ToResponse(jd));
    }

    /// <summary>POST /api/job-descriptions/{id}/parse — Trigger AI parsing of JD</summary>
    [HttpPost("{id:guid}/parse")]
    [Authorize(Roles = "Recruiter,SuperAdmin")]
    public async Task<IActionResult> Parse(Guid id, CancellationToken ct)
    {
        var jd = await _jdRepo.GetByIdAsync(id, ct);
        if (jd is null) return NotFound();

        if (string.IsNullOrWhiteSpace(jd.RawText))
            return BadRequest(new { message = "JD has no raw text to parse." });

        string parsedJson;
        try
        {
            var plugin = new JdParserPlugin();
            parsedJson = await plugin.ParseJdAsync(_kernel, jd.RawText);
        }
        catch (KernelException kex) when (kex.Message.Contains("required service"))
        {
            _logger.LogWarning("AI service not configured when parsing JD {JdId}", id);
            return StatusCode(503, new { message = "AI service is not configured in this environment. Please contact the system administrator." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "AI parse failed for JD {JdId}", id);
            return StatusCode(502, new { message = "AI service call failed. Please try again later." });
        }

        jd.ParsedJson = parsedJson;
        jd.PromptVersion = "1.0";
        await _jdRepo.UpdateAsync(jd, ct);

        return Ok(new JdAnalysisResponse(jd.Id, parsedJson));
    }

    /// <summary>POST /api/job-descriptions/upload — Create JD from an uploaded file (PDF / DOCX / TXT)</summary>
    [HttpPost("upload")]
    [Authorize(Roles = "Recruiter,SuperAdmin")]
    [RequestSizeLimit(10 * 1024 * 1024)]
    public async Task<IActionResult> Upload(
        [FromForm] string title,
        IFormFile file,
        [FromForm] Guid? clientId,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(title))
            return BadRequest(new { message = "Title is required." });

        if (file is null || file.Length == 0)
            return BadRequest(new { message = "File is required." });

        if (!FileTextExtractorService.IsValidFile(file.FileName, file.ContentType, file.Length, out var fileError))
            return BadRequest(new { message = fileError });

        var recruiterId = await ResolveRecruiterIdAsync(ct);
        if (recruiterId is null) return Forbid();

        string rawText;
        await using (var stream = file.OpenReadStream())
        {
            rawText = await FileTextExtractorService.ExtractTextAsync(stream, file.FileName);
        }

        if (string.IsNullOrWhiteSpace(rawText))
            return BadRequest(new { message = "Could not extract text from the uploaded file. Please paste the text manually." });

        var jd = new JobDescription
        {
            Id = Guid.NewGuid(),
            RecruiterId = recruiterId.Value,
            ClientId = clientId,
            Title = title,
            RawText = rawText,
        };

        await _jdRepo.AddAsync(jd, ct);
        _logger.LogInformation("JD created via file upload: {JdId} for recruiter {RecruiterId}", jd.Id, recruiterId);
        return CreatedAtAction(nameof(GetById), new { id = jd.Id }, ToResponse(jd));
    }
}
