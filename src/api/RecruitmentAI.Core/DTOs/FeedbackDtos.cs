namespace RecruitmentAI.Core.DTOs;

public record CreateFeedbackRequest(
    Guid CandidateId,
    Guid JobDescriptionId,
    Guid RecruiterId,
    string Outcome,
    string Tags = "[]",
    string? Comments = null
);

public record FeedbackResponse(
    Guid Id,
    Guid CandidateId,
    Guid JobDescriptionId,
    Guid RecruiterId,
    string Outcome,
    string Tags,
    string? Comments,
    DateTime CreatedAt
);
