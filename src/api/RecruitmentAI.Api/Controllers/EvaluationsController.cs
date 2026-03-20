using Microsoft.AspNetCore.Mvc;
using Microsoft.SemanticKernel;
using RecruitmentAI.Core.Entities;
using RecruitmentAI.Core.Interfaces;
using RecruitmentAI.Plugins;

namespace RecruitmentAI.Api.Controllers;

[ApiController]
[Route("api/evaluations")]
public class EvaluationsController : ControllerBase
{
    private readonly IEvaluationReportRepository _evalRepo;
    private readonly ICandidateSubmissionRepository _submissionRepo;
    private readonly IJobDescriptionRepository _jdRepo;
    private readonly Kernel _kernel;

    public EvaluationsController(
        IEvaluationReportRepository evalRepo,
        ICandidateSubmissionRepository submissionRepo,
        IJobDescriptionRepository jdRepo,
        Kernel kernel)
    {
        _evalRepo = evalRepo;
        _submissionRepo = submissionRepo;
        _jdRepo = jdRepo;
        _kernel = kernel;
    }

    /// <summary>POST /api/evaluations/evaluate/{submissionId} — Trigger AI evaluation</summary>
    [HttpPost("evaluate/{submissionId:guid}")]
    public async Task<IActionResult> Evaluate(Guid submissionId, CancellationToken ct)
    {
        var submission = await _submissionRepo.GetByIdAsync(submissionId, ct);
        if (submission is null) return NotFound();

        if (submission.SubmittedAt is null)
            return BadRequest(new { message = "Candidate has not submitted answers yet." });

        // Get the JD for this submission
        var questionnaire = await _submissionRepo.GetByIdAsync(submissionId, ct);
        // We need to load the questionnaire → JD chain
        // Reload with includes
        var fullSubmission = submission;

        // Step 1: Evaluate answers
        var evaluator = new AnswerEvaluatorPlugin();
        var jd = await _jdRepo.GetByIdAsync(fullSubmission.Questionnaire?.JobDescription?.Id ?? Guid.Empty, ct);
        var jdRequirements = jd?.ParsedJson ?? "{}";

        var evaluationJson = await evaluator.EvaluateAnswersAsync(_kernel, fullSubmission.AnswersJson, jdRequirements);

        // Step 2: Generate report
        var reportGen = new ReportGeneratorPlugin();
        var reportJson = await reportGen.GenerateReportAsync(_kernel, evaluationJson, 1);

        var report = new EvaluationReport
        {
            Id = Guid.NewGuid(),
            SubmissionId = submissionId,
            Stage = 1,
            ReportJson = reportJson,
            AiScore = 0, // Will be extracted from reportJson
            Recommendation = "Pending", // Will be extracted from reportJson
        };

        // Try to extract score and recommendation from the report
        try
        {
            using var doc = System.Text.Json.JsonDocument.Parse(reportJson);
            if (doc.RootElement.TryGetProperty("confidenceScore", out var score))
                report.AiScore = score.GetDouble();
            if (doc.RootElement.TryGetProperty("recommendation", out var rec))
                report.Recommendation = rec.GetString() ?? "Pending";
        }
        catch { /* non-critical if parsing fails */ }

        await _evalRepo.AddAsync(report, ct);

        return Ok(new
        {
            report.Id,
            report.SubmissionId,
            report.Stage,
            report.AiScore,
            report.Recommendation,
            report.ReportJson,
            report.CreatedAt
        });
    }

    /// <summary>GET /api/evaluations/{id}</summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var report = await _evalRepo.GetByIdAsync(id, ct);
        if (report is null) return NotFound();

        return Ok(new
        {
            report.Id,
            report.SubmissionId,
            report.Stage,
            report.AiScore,
            report.Recommendation,
            report.ReportJson,
            report.CreatedAt
        });
    }

    /// <summary>GET /api/evaluations/by-submission/{submissionId}</summary>
    [HttpGet("by-submission/{submissionId:guid}")]
    public async Task<IActionResult> GetBySubmission(Guid submissionId, CancellationToken ct)
    {
        var reports = await _evalRepo.GetBySubmissionAsync(submissionId, ct);
        return Ok(reports.Select(r => new
        {
            r.Id,
            r.SubmissionId,
            r.Stage,
            r.AiScore,
            r.Recommendation,
            r.ReportJson,
            r.CreatedAt
        }));
    }
}
