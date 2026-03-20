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
    private readonly Kernel _kernel;

    public EvaluationsController(
        IEvaluationReportRepository evalRepo,
        ICandidateSubmissionRepository submissionRepo,
        Kernel kernel)
    {
        _evalRepo = evalRepo;
        _submissionRepo = submissionRepo;
        _kernel = kernel;
    }

    /// <summary>POST /api/evaluations/evaluate/{submissionId} — Trigger AI evaluation</summary>
    [HttpPost("evaluate/{submissionId:guid}")]
    public async Task<IActionResult> Evaluate(Guid submissionId, CancellationToken ct)
    {
        // Load full chain: Submission → Questionnaire → JobDescription
        var submission = await _submissionRepo.GetByIdWithChainAsync(submissionId, ct);
        if (submission is null) return NotFound();

        if (submission.SubmittedAt is null)
            return BadRequest(new { message = "Candidate has not submitted answers yet." });

        var jdRequirements = submission.Questionnaire?.JobDescription?.ParsedJson ?? "{}";

        // Step 1: Evaluate answers
        var evaluator = new AnswerEvaluatorPlugin();
        var evaluationJson = await evaluator.EvaluateAnswersAsync(_kernel, submission.AnswersJson, jdRequirements);

        // Step 2: Generate Stage 1 report
        var reportGen = new ReportGeneratorPlugin();
        var reportJson = await reportGen.GenerateReportAsync(_kernel, evaluationJson, 1);

        var report = new EvaluationReport
        {
            Id = Guid.NewGuid(),
            SubmissionId = submissionId,
            Stage = 1,
            ReportJson = reportJson,
            AiScore = 0,
            Recommendation = "Pending",
        };

        // Extract score and recommendation from the report JSON
        try
        {
            using var doc = System.Text.Json.JsonDocument.Parse(reportJson);
            if (doc.RootElement.TryGetProperty("confidenceScore", out var score))
                report.AiScore = score.GetDouble();
            if (doc.RootElement.TryGetProperty("recommendation", out var rec))
                report.Recommendation = rec.GetString() ?? "Pending";
        }
        catch { /* non-critical */ }

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
