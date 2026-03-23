using Microsoft.AspNetCore.Mvc;
using RecruitmentAI.Core.DTOs;
using RecruitmentAI.Core.Interfaces;

namespace RecruitmentAI.Api.Controllers;

[ApiController]
[Route("api/talent-pool")]
public class TalentPoolController : ControllerBase
{
    private readonly ITalentPoolRepository _talentPool;
    private readonly ICandidateRepository _candidates;

    public TalentPoolController(
        ITalentPoolRepository talentPool,
        ICandidateRepository candidates)
    {
        _talentPool = talentPool;
        _candidates = candidates;
    }

    /// <summary>
    /// Search talent pool. Optionally filter by skill keyword (matched against SkillTags or Name)
    /// and/or a minimum Stage 1 AI score.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<TalentPoolCandidateResponse>>> Search(
        [FromQuery] string? skills,
        [FromQuery] double? minScore,
        CancellationToken ct)
    {
        var candidates = await _talentPool.SearchAsync(skills, minScore, ct);

        var results = candidates.Select(c =>
        {
            var latestEval = c.Submissions
                .SelectMany(s => s.EvaluationReports)
                .Where(er => er.Stage == 1)
                .OrderByDescending(er => er.CreatedAt)
                .FirstOrDefault();

            var lastFeedback = c.ClientFeedbacks
                .OrderByDescending(f => f.CreatedAt)
                .FirstOrDefault();

            return new TalentPoolCandidateResponse(
                Id: c.Id,
                Name: c.Name,
                Email: c.Email,
                SkillTags: c.SkillTags,
                WorkspaceId: c.WorkspaceId,
                CreatedAt: c.CreatedAt,
                TotalSubmissions: c.Submissions.Count,
                LatestAiScore: latestEval?.AiScore,
                LatestRecommendation: latestEval?.Recommendation,
                LastOutcome: lastFeedback?.Outcome
            );
        }).ToList();

        return Ok(results);
    }

    /// <summary>Update skill tags for a candidate (used from Talent Pool UI).</summary>
    [HttpPatch("{candidateId:guid}/skills")]
    public async Task<IActionResult> UpdateSkillTags(
        Guid candidateId,
        [FromBody] UpdateCandidateSkillTagsRequest request,
        CancellationToken ct)
    {
        var candidate = await _candidates.GetByIdAsync(candidateId, ct);
        if (candidate is null) return NotFound();

        candidate.SkillTags = request.SkillTags;
        await _candidates.UpdateAsync(candidate, ct);
        return NoContent();
    }
}
