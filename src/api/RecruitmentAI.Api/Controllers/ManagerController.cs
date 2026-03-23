using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RecruitmentAI.Core.DTOs;
using RecruitmentAI.Infrastructure.Data;

namespace RecruitmentAI.Api.Controllers;

[ApiController]
[Route("api/manager")]
public class ManagerController : ControllerBase
{
    private readonly RecruitmentDbContext _db;

    public ManagerController(RecruitmentDbContext db) => _db = db;

    /// <summary>Returns KPI statistics for the Manager Dashboard.</summary>
    [HttpGet("stats")]
    public async Task<ActionResult<ManagerStatsResponse>> GetStats(CancellationToken ct)
    {
        var jdCount = await _db.JobDescriptions.CountAsync(ct);
        var candidateCount = await _db.Candidates.CountAsync(ct);
        var submissionCount = await _db.CandidateSubmissions.CountAsync(ct);

        var stage1Reports = await _db.EvaluationReports
            .Where(r => r.Stage == 1)
            .Select(r => new { r.Recommendation, r.AiScore })
            .ToListAsync(ct);

        var passCount   = stage1Reports.Count(r => r.Recommendation == "Pass");
        var holdCount   = stage1Reports.Count(r => r.Recommendation == "Hold");
        var rejectCount = stage1Reports.Count(r => r.Recommendation == "Reject");
        var evaluated   = stage1Reports.Count;
        var passRate    = evaluated > 0 ? Math.Round((double)passCount / evaluated * 100, 1) : 0;
        var avgScore    = evaluated > 0 ? Math.Round(stage1Reports.Average(r => r.AiScore), 1) : 0;

        var stage2Count = await _db.InterviewGuides.CountAsync(ct);

        var feedbacks = await _db.ClientFeedbacks
            .Select(f => f.Outcome)
            .ToListAsync(ct);

        var hired      = feedbacks.Count(o => o == "Hired");
        var rejClient  = feedbacks.Count(o => o == "Rejected at Client");
        var hireRate   = feedbacks.Count > 0 ? Math.Round((double)hired / feedbacks.Count * 100, 1) : 0;

        return Ok(new ManagerStatsResponse(
            TotalJobDescriptions: jdCount,
            TotalCandidates: candidateCount,
            TotalSubmissions: submissionCount,
            EvaluatedSubmissions: evaluated,
            Stage1PassCount: passCount,
            Stage1HoldCount: holdCount,
            Stage1RejectCount: rejectCount,
            Stage1PassRate: passRate,
            Stage2CompletedCount: stage2Count,
            TotalFeedbacks: feedbacks.Count,
            HiredCount: hired,
            RejectedAtClientCount: rejClient,
            HireRate: hireRate,
            AverageAiScore: avgScore
        ));
    }
}
