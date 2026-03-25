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
[Route("api/candidates")]
[Authorize]
public class CandidatesController : ControllerBase
{
    private readonly ICandidateRepository _candidateRepo;
    private readonly ICandidateSubmissionRepository _submissionRepo;
    private readonly IQuestionnaireRepository _questionnaireRepo;
    private readonly IBlobStorageService _blobService;
    private readonly Kernel _kernel;

    private static readonly HashSet<string> AllowedExtensions = [".pdf", ".docx"];
    private static readonly HashSet<string> AllowedMimeTypes =
    [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];
    private const long MaxFileSize = 10 * 1024 * 1024; // 10MB

    public CandidatesController(
        ICandidateRepository candidateRepo,
        ICandidateSubmissionRepository submissionRepo,
        IQuestionnaireRepository questionnaireRepo,
        IBlobStorageService blobService,
        Kernel kernel)
    {
        _candidateRepo = candidateRepo;
        _submissionRepo = submissionRepo;
        _questionnaireRepo = questionnaireRepo;
        _blobService = blobService;
        _kernel = kernel;
    }

    private static CandidateResponse ToResponse(Candidate c) =>
        new(c.Id, c.Name, c.Email, c.ResumeBlobUrl, c.WorkspaceId, c.CreatedAt);

    [HttpGet]
    [Authorize(Roles = "Recruiter,Interviewer,Manager,SuperAdmin")]
    public async Task<IActionResult> GetCandidates([FromQuery] Guid? workspaceId, CancellationToken ct)
    {
        var role = User.FindFirstValue(ClaimTypes.Role);

        IReadOnlyList<Candidate> candidates;
        if (role is "Interviewer" or "Manager" or "SuperAdmin")
        {
            candidates = await _candidateRepo.GetAllAsync(ct);
        }
        else
        {
            var wsStr = User.FindFirstValue("workspaceId");
            var wsId = workspaceId ?? (Guid.TryParse(wsStr, out var id) ? id : Guid.Empty);
            if (wsId == Guid.Empty) return Forbid();
            candidates = await _candidateRepo.GetAllByWorkspaceAsync(wsId, ct);
        }

        return Ok(candidates.Select(ToResponse));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var candidate = await _candidateRepo.GetByIdAsync(id, ct);
        if (candidate is null) return NotFound();
        return Ok(ToResponse(candidate));
    }

    [HttpPost]
    [Authorize(Roles = "Recruiter,SuperAdmin")]
    public async Task<IActionResult> Create([FromBody] CreateCandidateRequest request, CancellationToken ct)
    {
        var wsStr = User.FindFirstValue("workspaceId");
        if (!Guid.TryParse(wsStr, out var workspaceId)) return Forbid();

        var candidate = new Candidate
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Email = request.Email,
            WorkspaceId = workspaceId,
        };

        await _candidateRepo.AddAsync(candidate, ct);
        return CreatedAtAction(nameof(GetById), new { id = candidate.Id }, ToResponse(candidate));
    }

    [HttpPost("{id:guid}/resume")]
    [RequestSizeLimit(MaxFileSize)]
    public async Task<IActionResult> UploadResume(Guid id, IFormFile file, CancellationToken ct)
    {
        var candidate = await _candidateRepo.GetByIdAsync(id, ct);
        if (candidate is null) return NotFound();

        if (file.Length == 0 || file.Length > MaxFileSize)
            return BadRequest("File is empty or exceeds 10MB limit.");

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(ext))
            return BadRequest("Only .pdf and .docx files are allowed.");

        if (!AllowedMimeTypes.Contains(file.ContentType))
            return BadRequest("Invalid file content type.");

        var blobName = $"resumes/{candidate.Id}{ext}";
        await using var stream = file.OpenReadStream();
        var blobUrl = await _blobService.UploadAsync("documents", blobName, stream, file.ContentType, ct);

        candidate.ResumeBlobUrl = blobUrl;
        await _candidateRepo.UpdateAsync(candidate, ct);

        return Ok(new CandidateResponse(
            candidate.Id, candidate.Name, candidate.Email, candidate.ResumeBlobUrl, candidate.WorkspaceId, candidate.CreatedAt));
    }

    [HttpPost("{id:guid}/tokens")]
    public async Task<IActionResult> GenerateToken(Guid id, [FromBody] GenerateTokenRequest request, CancellationToken ct)
    {
        var candidate = await _candidateRepo.GetByIdAsync(id, ct);
        if (candidate is null) return NotFound();

        var questionnaire = await _questionnaireRepo.GetByIdAsync(request.QuestionnaireId, ct);
        if (questionnaire is null) return BadRequest("Questionnaire not found.");

        var token = Convert.ToBase64String(Guid.NewGuid().ToByteArray())
            .Replace("+", "-").Replace("/", "_").TrimEnd('=');
        var expiresAt = DateTime.UtcNow.AddHours(request.ExpiryHours);

        var submission = new CandidateSubmission
        {
            Id = Guid.NewGuid(),
            CandidateId = id,
            QuestionnaireId = request.QuestionnaireId,
            Token = token,
            TokenExpiresAt = expiresAt,
        };

        await _submissionRepo.AddAsync(submission, ct);

        var baseUrl = $"{Request.Scheme}://{Request.Host}";
        return Ok(new TokenResponse(token, expiresAt, $"{baseUrl}/candidate/{token}", submission.Id));
    }

    [HttpPost("parse-resume")]
    [Authorize(Roles = "Recruiter,SuperAdmin")]
    [RequestSizeLimit(10 * 1024 * 1024)]
    public async Task<IActionResult> ParseResume(IFormFile file, CancellationToken ct)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { message = "File is required." });

        if (!FileTextExtractorService.IsValidFile(file.FileName, file.ContentType, file.Length, out var fileError))
            return BadRequest(new { message = fileError });

        string rawText;
        await using (var stream = file.OpenReadStream())
        {
            rawText = await FileTextExtractorService.ExtractTextAsync(stream, file.FileName);
        }

        if (string.IsNullOrWhiteSpace(rawText))
            return BadRequest(new { message = "Could not extract text from the uploaded file." });

        string parsedJson;
        try
        {
            var plugin = new ResumeParserPlugin();
            parsedJson = await plugin.ParseResumeAsync(_kernel, rawText);
        }
        catch (KernelException)
        {
            // AI not available — return just the raw text so frontend can still proceed
            return Ok(new ResumeParseResult(string.Empty, string.Empty, rawText));
        }
        catch
        {
            return Ok(new ResumeParseResult(string.Empty, string.Empty, rawText));
        }

        string name = string.Empty, email = string.Empty;
        try
        {
            var doc = System.Text.Json.JsonDocument.Parse(parsedJson);
            name = doc.RootElement.GetProperty("name").GetString() ?? string.Empty;
            email = doc.RootElement.GetProperty("email").GetString() ?? string.Empty;
        }
        catch { /* AI returned invalid JSON — fallback to empty */ }

        return Ok(new ResumeParseResult(name, email, rawText));
    }
}
