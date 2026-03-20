using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RecruitmentAI.Core.DTOs;
using RecruitmentAI.Core.Entities;
using RecruitmentAI.Core.Interfaces;

namespace RecruitmentAI.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/feedback")]
public class FeedbackController : ControllerBase
{
    private readonly IClientFeedbackRepository _feedbackRepo;

    public FeedbackController(IClientFeedbackRepository feedbackRepo)
    {
        _feedbackRepo = feedbackRepo;
    }

    /// <summary>POST /api/feedback — Submit client feedback for a candidate outcome</summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateFeedbackRequest req, CancellationToken ct)
    {
        var validOutcomes = new[] { "Hired", "Rejected at Client", "Offer Declined", "In Progress" };
        if (!validOutcomes.Contains(req.Outcome))
            return BadRequest(new { message = $"Outcome must be one of: {string.Join(", ", validOutcomes)}" });

        var feedback = new ClientFeedback
        {
            Id = Guid.NewGuid(),
            CandidateId = req.CandidateId,
            JobDescriptionId = req.JobDescriptionId,
            RecruiterId = req.RecruiterId,
            Outcome = req.Outcome,
            Tags = req.Tags,
            Comments = req.Comments,
        };

        await _feedbackRepo.AddAsync(feedback, ct);

        return Ok(new FeedbackResponse(
            feedback.Id,
            feedback.CandidateId,
            feedback.JobDescriptionId,
            feedback.RecruiterId,
            feedback.Outcome,
            feedback.Tags,
            feedback.Comments,
            feedback.CreatedAt
        ));
    }

    /// <summary>GET /api/feedback?recruiterId={id} — Get feedback by recruiter</summary>
    [HttpGet]
    public async Task<IActionResult> GetByRecruiter([FromQuery] Guid recruiterId, CancellationToken ct)
    {
        var feedbacks = await _feedbackRepo.GetByRecruiterAsync(recruiterId, ct);
        return Ok(feedbacks.Select(f => new FeedbackResponse(
            f.Id,
            f.CandidateId,
            f.JobDescriptionId,
            f.RecruiterId,
            f.Outcome,
            f.Tags,
            f.Comments,
            f.CreatedAt
        )));
    }
}
