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

    [HttpPost("generate/{submissionId:guid}")]
    public async Task<IActionResult> Generate(Guid submissionId, CancellationToken ct)
    {
        var submission = await _submissionRepo.GetByIdWithChainAsync(submissionId, ct);
        if (submission is null) return NotFound();

        var stage1Reports = await _evalRepo.GetBySubmissionAsync(submissionId, ct);
        var stage1 = stage1Reports.FirstOrDefault(r => r.Stage == 1);
        if (stage1 is null)
            return BadRequest(new { message = "Stage 1 evaluation must be completed before generating an interview guide." });

        var existing = await _guideRepo.GetBySubmissionAsync(submissionId, ct);
        if (existing is not null)
            return Ok(new InterviewGuideResponse(existing.Id, existing.SubmissionId, existing.GuideJson, existing.CreatedAt));

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

    [HttpGet("{submissionId:guid}")]
    public async Task<IActionResult> GetBySubmission(Guid submissionId, CancellationToken ct)
    {
        var guide = await _guideRepo.GetBySubmissionAsync(submissionId, ct);
        if (guide is null) return NotFound();

        return Ok(new InterviewGuideResponse(guide.Id, guide.SubmissionId, guide.GuideJson, guide.CreatedAt));
    }
}
