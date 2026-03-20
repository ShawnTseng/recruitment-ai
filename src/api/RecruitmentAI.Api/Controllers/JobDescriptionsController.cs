using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.SemanticKernel;
using RecruitmentAI.Core.DTOs;
using RecruitmentAI.Core.Entities;
using RecruitmentAI.Core.Interfaces;
using RecruitmentAI.Plugins;

namespace RecruitmentAI.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/job-descriptions")]
public class JobDescriptionsController : ControllerBase
{
    private readonly IJobDescriptionRepository _jdRepo;
    private readonly IBlobStorageService _blobService;
    private readonly Kernel _kernel;
    private readonly ILogger<JobDescriptionsController> _logger;

    private static readonly HashSet<string> AllowedExtensions = [".pdf", ".docx"];
    private static readonly HashSet<string> AllowedMimeTypes =
    [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];
    private const long MaxFileSize = 10 * 1024 * 1024; // 10MB

    public JobDescriptionsController(
        IJobDescriptionRepository jdRepo,
        IBlobStorageService blobService,
        Kernel kernel,
        ILogger<JobDescriptionsController> logger)
    {
        _jdRepo = jdRepo;
        _blobService = blobService;
        _kernel = kernel;
        _logger = logger;
    }

    /// <summary>GET /api/job-descriptions?recruiterId={id}</summary>
    [HttpGet]
    public async Task<IActionResult> GetByRecruiter([FromQuery] Guid recruiterId, CancellationToken ct)
    {
        var jds = await _jdRepo.GetByRecruiterAsync(recruiterId, ct);
        var response = jds.Select(jd => new JobDescriptionResponse(
            jd.Id, jd.RecruiterId, jd.Title, jd.BlobUrl, jd.ParsedJson, jd.PromptVersion, jd.CreatedAt));
        return Ok(response);
    }

    /// <summary>GET /api/job-descriptions/{id}</summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var jd = await _jdRepo.GetByIdAsync(id, ct);
        if (jd is null) return NotFound();
        return Ok(new JobDescriptionResponse(
            jd.Id, jd.RecruiterId, jd.Title, jd.BlobUrl, jd.ParsedJson, jd.PromptVersion, jd.CreatedAt));
    }

    /// <summary>POST /api/job-descriptions — Create with raw text</summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateJobDescriptionRequest request, [FromQuery] Guid recruiterId, CancellationToken ct)
    {
        var jd = new JobDescription
        {
            Id = Guid.NewGuid(),
            RecruiterId = recruiterId,
            Title = request.Title,
            RawText = request.RawText ?? string.Empty,
        };

        await _jdRepo.AddAsync(jd, ct);
        return CreatedAtAction(nameof(GetById), new { id = jd.Id },
            new JobDescriptionResponse(jd.Id, jd.RecruiterId, jd.Title, jd.BlobUrl, jd.ParsedJson, jd.PromptVersion, jd.CreatedAt));
    }

    /// <summary>POST /api/job-descriptions/upload — Upload JD file (PDF/DOCX)</summary>
    [HttpPost("upload")]
    [RequestSizeLimit(MaxFileSize)]
    public async Task<IActionResult> Upload(IFormFile file, [FromQuery] Guid recruiterId, [FromQuery] string title, CancellationToken ct)
    {
        // Validate file
        if (file.Length == 0 || file.Length > MaxFileSize)
            return BadRequest("File is empty or exceeds 10MB limit.");

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(ext))
            return BadRequest("Only .pdf and .docx files are allowed.");

        if (!AllowedMimeTypes.Contains(file.ContentType))
            return BadRequest("Invalid file content type.");

        // Upload to Blob Storage
        var blobName = $"jd/{Guid.NewGuid()}{ext}";
        await using var stream = file.OpenReadStream();
        var blobUrl = await _blobService.UploadAsync("documents", blobName, stream, file.ContentType, ct);

        var jd = new JobDescription
        {
            Id = Guid.NewGuid(),
            RecruiterId = recruiterId,
            Title = title,
            BlobUrl = blobUrl,
            RawText = string.Empty, // Will be populated after parsing
        };

        await _jdRepo.AddAsync(jd, ct);
        _logger.LogInformation("JD uploaded for recruiter {RecruiterId}, JD {JdId}", recruiterId, jd.Id);

        return CreatedAtAction(nameof(GetById), new { id = jd.Id },
            new JobDescriptionResponse(jd.Id, jd.RecruiterId, jd.Title, jd.BlobUrl, jd.ParsedJson, jd.PromptVersion, jd.CreatedAt));
    }

    /// <summary>POST /api/job-descriptions/{id}/parse — Trigger AI parsing of JD</summary>
    [HttpPost("{id:guid}/parse")]
    public async Task<IActionResult> Parse(Guid id, CancellationToken ct)
    {
        var jd = await _jdRepo.GetByIdAsync(id, ct);
        if (jd is null) return NotFound();

        if (string.IsNullOrWhiteSpace(jd.RawText))
            return BadRequest("JD has no raw text to parse. Upload or provide text first.");

        var plugin = new JdParserPlugin();
        var parsedJson = await plugin.ParseJdAsync(_kernel, jd.RawText);

        jd.ParsedJson = parsedJson;
        jd.PromptVersion = "1.0";
        await _jdRepo.UpdateAsync(jd, ct);

        return Ok(new JdAnalysisResponse(jd.Id, parsedJson));
    }
}
