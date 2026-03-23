namespace RecruitmentAI.Core.DTOs;

public record TalentPoolCandidateResponse(
    Guid Id,
    string Name,
    string Email,
    string SkillTags,
    Guid WorkspaceId,
    DateTime CreatedAt,
    int TotalSubmissions,
    double? LatestAiScore,
    string? LatestRecommendation,
    string? LastOutcome
);

public record UpdateCandidateSkillTagsRequest(
    string SkillTags
);
