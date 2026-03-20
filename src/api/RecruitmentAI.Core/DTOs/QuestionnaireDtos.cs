namespace RecruitmentAI.Core.DTOs;

public record QuestionnaireResponse(
    Guid Id,
    Guid JobDescriptionId,
    string? TemplateVersion,
    string QuestionsJson,
    DateTime CreatedAt
);

public record GenerateQuestionnaireRequest(
    Guid JobDescriptionId,
    string? ResumeText = null
);
