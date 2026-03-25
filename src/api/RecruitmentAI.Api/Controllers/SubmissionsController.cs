using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RecruitmentAI.Core.DTOs;
using RecruitmentAI.Core.Interfaces;

namespace RecruitmentAI.Api.Controllers;

[ApiController]
[Route("api/submissions")]
public class SubmissionsController : ControllerBase
{
    private readonly ICandidateSubmissionRepository _submissionRepo;

    public SubmissionsController(ICandidateSubmissionRepository submissionRepo)
    {
        _submissionRepo = submissionRepo;
    }

    [HttpGet("by-token/{token}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetByToken(string token, CancellationToken ct)
    {
        var submission = await _submissionRepo.GetByTokenAsync(token, ct);
        if (submission is null)
            return NotFound(new { message = "Token is invalid, expired, or already used." });

        return Ok(new SubmissionInfoResponse(
            submission.Id,
            submission.Questionnaire.QuestionsJson,
            submission.Questionnaire.JobDescription?.Title));
    }

    [HttpPost("by-token/{token}/answer")]
    [AllowAnonymous]
    public async Task<IActionResult> SubmitAnswers(string token, [FromBody] SubmitAnswersRequest request, CancellationToken ct)
    {
        var submission = await _submissionRepo.GetByTokenAsync(token, ct);
        if (submission is null)
            return NotFound(new { message = "Token is invalid, expired, or already used." });

        if (!request.ConsentAiEvaluation)
            return BadRequest(new { message = "AI evaluation consent is required." });

        submission.AnswersJson = request.AnswersJson;
        submission.SubmittedAt = DateTime.UtcNow;
        submission.TokenUsed = true;

        await _submissionRepo.UpdateAsync(submission, ct);

        return Ok(new { message = "Answers submitted successfully.", submissionId = submission.Id });
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var submission = await _submissionRepo.GetByIdAsync(id, ct);
        if (submission is null) return NotFound();

        return Ok(new SubmissionResponse(
            submission.Id,
            submission.CandidateId,
            submission.QuestionnaireId,
            submission.AnswersJson,
            submission.SubmittedAt));
    }

    [HttpGet]
    public async Task<IActionResult> GetByCandidate([FromQuery] Guid candidateId, CancellationToken ct)
    {
        var submissions = await _submissionRepo.GetByCandidateAsync(candidateId, ct);
        return Ok(submissions.Select(s => new
        {
            s.Id,
            s.CandidateId,
            s.QuestionnaireId,
            s.SubmittedAt,
        }));
    }
}
