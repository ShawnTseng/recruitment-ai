using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RecruitmentAI.Core.DTOs;
using RecruitmentAI.Core.Entities;
using RecruitmentAI.Core.Interfaces;

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
        IBlobStorageService blobService)
    {
        _candidateRepo = candidateRepo;
        _submissionRepo = submissionRepo;
        _questionnaireRepo = questionnaireRepo;
        _blobService = blobService;
    }

    private static CandidateResponse ToResponse(Candidate c) =>
        new(c.Id, c.Name, c.Email, c.ResumeBlobUrl, c.WorkspaceId, c.CreatedAt);

    /// <summary>GET /api/candidates?workspaceId={id}
    /// Recruiters pass their workspaceId. Interviewers/Managers get all (workspaceId ignored).</summary>
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
            // Recruiter: use JWT workspaceId for isolation
            var wsStr = User.FindFirstValue("workspaceId");
            var wsId = workspaceId ?? (Guid.TryParse(wsStr, out var id) ? id : Guid.Empty);
            if (wsId == Guid.Empty) return Forbid();
            candidates = await _candidateRepo.GetAllByWorkspaceAsync(wsId, ct);
        }

        return Ok(candidates.Select(ToResponse));
    }

    /// <summary>GET /api/candidates/{id}</summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var candidate = await _candidateRepo.GetByIdAsync(id, ct);
        if (candidate is null) return NotFound();
        return Ok(ToResponse(candidate));
    }

    /// <summary>POST /api/candidates</summary>
    [HttpPost]
    [Authorize(Roles = "Recruiter,SuperAdmin")]
    public async Task<IActionResult> Create([FromBody] CreateCandidateRequest request, CancellationToken ct)
    {
        var candidate = new Candidate
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Email = request.Email,
            WorkspaceId = request.WorkspaceId,
        };

        await _candidateRepo.AddAsync(candidate, ct);
        return CreatedAtAction(nameof(GetById), new { id = candidate.Id }, ToResponse(candidate));
    }

    /// <summary>POST /api/candidates/{id}/resume — Upload resume</summary>
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

    /// <summary>POST /api/candidates/{id}/tokens — Generate a one-time submission token</summary>
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
}
