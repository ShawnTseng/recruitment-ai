using Microsoft.AspNetCore.Mvc;
using Microsoft.SemanticKernel;
using RecruitmentAI.Core.DTOs;
using RecruitmentAI.Core.Entities;
using RecruitmentAI.Core.Interfaces;
using RecruitmentAI.Plugins;

namespace RecruitmentAI.Api.Controllers;

[ApiController]
[Route("api/interviews")]
public class InterviewsController : ControllerBase
{
    private readonly IInterviewGuideRepository _guideRepo;
    private readonly ICandidateSubmissionRepository _submissionRepo;
    private readonly IEvaluationReportRepository _evalRepo;
    private readonly Kernel _kernel;

    public InterviewsController(
        IInterviewGuideRepository guideRepo,
        ICandidateSubmissionRepository submissionRepo,
        IEvaluationReportRepository evalRepo,
        Kernel kernel)
    {
        _guideRepo = guideRepo;
        _submissionRepo = submissionRepo;
        _evalRepo = evalRepo;
        _kernel = kernel;
    }

    /// <summary>POST /api/interviews/generate/{submissionId} — Generate Stage 2 interview guide from Stage 1 evaluation</summary>
    [HttpPost("generate/{submissionId:guid}")]
    public async Task<IActionResult> Generate(Guid submissionId, CancellationToken ct)
    {
        var submission = await _submissionRepo.GetByIdWithChainAsync(submissionId, ct);
        if (submission is null) return NotFound();

        // Require Stage 1 evaluation to exist before generating Stage 2 guide
        var stage1Reports = await _evalRepo.GetBySubmissionAsync(submissionId, ct);
        var stage1 = stage1Reports.FirstOrDefault(r => r.Stage == 1);
        if (stage1 is null)
            return BadRequest(new { message = "Stage 1 evaluation must be completed before generating an interview guide." });

        // Check if guide already exists — return existing one
        var existing = await _guideRepo.GetBySubmissionAsync(submissionId, ct);
        if (existing is not null)
            return Ok(new InterviewGuideResponse(existing.Id, existing.SubmissionId, existing.GuideJson, existing.CreatedAt));

        // Generate Stage 2 interview guide using the Stage 1 evaluation report
        var reportGen = new ReportGeneratorPlugin();
        var guideJson = await reportGen.GenerateReportAsync(_kernel, stage1.ReportJson, 2);

        var guide = new InterviewGuide
        {
            Id = Guid.NewGuid(),
            SubmissionId = submissionId,
            GuideJson = guideJson,
        };

        await _guideRepo.AddAsync(guide, ct);

        return Ok(new InterviewGuideResponse(guide.Id, guide.SubmissionId, guide.GuideJson, guide.CreatedAt));
    }

    /// <summary>GET /api/interviews/{submissionId} — Get interview guide for a submission</summary>
    [HttpGet("{submissionId:guid}")]
    public async Task<IActionResult> GetBySubmission(Guid submissionId, CancellationToken ct)
    {
        var guide = await _guideRepo.GetBySubmissionAsync(submissionId, ct);
        if (guide is null) return NotFound();

        return Ok(new InterviewGuideResponse(guide.Id, guide.SubmissionId, guide.GuideJson, guide.CreatedAt));
    }
}
