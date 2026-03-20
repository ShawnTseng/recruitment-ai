namespace RecruitmentAI.Core.DTOs;

public record SubmissionInfoResponse(
    Guid SubmissionId,
    string QuestionsJson,
    string? JobTitle
);

public record SubmitAnswersRequest(
    string AnswersJson,
    bool ConsentAiEvaluation = true
);

public record SubmissionResponse(
    Guid Id,
    Guid CandidateId,
    Guid QuestionnaireId,
    string AnswersJson,
    DateTime? SubmittedAt
);
