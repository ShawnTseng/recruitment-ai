namespace RecruitmentAI.Core.DTOs;

public record CreateCandidateRequest(
    string Name,
    string Email,
    Guid WorkspaceId
);

public record CandidateResponse(
    Guid Id,
    string Name,
    string Email,
    string? ResumeBlobUrl,
    Guid WorkspaceId,
    DateTime CreatedAt
);

public record GenerateTokenRequest(
    Guid QuestionnaireId,
    int ExpiryHours = 72
);

public record TokenResponse(
    string Token,
    DateTime ExpiresAt,
    string SubmissionUrl
);
