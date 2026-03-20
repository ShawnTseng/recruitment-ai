namespace RecruitmentAI.Core.DTOs;

public record InterviewGuideResponse(
    Guid Id,
    Guid SubmissionId,
    string GuideJson,
    DateTime CreatedAt
);
