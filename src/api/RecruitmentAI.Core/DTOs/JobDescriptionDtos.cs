namespace RecruitmentAI.Core.DTOs;

public record CreateJobDescriptionRequest(
    string Title,
    string? RawText
);

public record JobDescriptionResponse(
    Guid Id,
    Guid RecruiterId,
    string Title,
    string? BlobUrl,
    string? ParsedJson,
    string? PromptVersion,
    DateTime CreatedAt
);

public record JdAnalysisResponse(
    Guid JobDescriptionId,
    string ParsedJson
);
