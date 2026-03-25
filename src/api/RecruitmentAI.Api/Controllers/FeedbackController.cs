using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RecruitmentAI.Core.DTOs;
using RecruitmentAI.Core.Entities;
using RecruitmentAI.Core.Interfaces;

namespace RecruitmentAI.Api.Controllers;

[ApiController]
[Route("api/feedback")]
[Authorize]
public class FeedbackController : ControllerBase
{
    private readonly IClientFeedbackRepository _feedbackRepo;

    public FeedbackController(IClientFeedbackRepository feedbackRepo)
    {
        _feedbackRepo = feedbackRepo;
    }

    private static FeedbackResponse ToResponse(ClientFeedback f) =>
        new(f.Id, f.CandidateId, f.JobDescriptionId, f.RecruiterId, f.Outcome, f.Tags, f.Comments, f.CreatedAt);

    [HttpPost]
    [Authorize(Roles = "Recruiter,AccountManager,SuperAdmin")]
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
        return Ok(ToResponse(feedback));
    }

    [HttpGet]
    [Authorize(Roles = "Recruiter,Manager,AccountManager,SuperAdmin")]
    public async Task<IActionResult> GetFeedback(CancellationToken ct)
    {
        var role = User.FindFirstValue(ClaimTypes.Role);
        IReadOnlyList<ClientFeedback> feedbacks;

        if (role is "Manager" or "AccountManager" or "SuperAdmin")
        {
            feedbacks = await _feedbackRepo.GetAllAsync(ct);
        }
        else
        {
            var workspaceIdStr = User.FindFirstValue("workspaceId");
            if (!Guid.TryParse(workspaceIdStr, out var recruiterId))
                return Forbid();
            feedbacks = await _feedbackRepo.GetByRecruiterAsync(recruiterId, ct);
        }

        return Ok(feedbacks.OrderByDescending(f => f.CreatedAt).Select(ToResponse));
    }
}
