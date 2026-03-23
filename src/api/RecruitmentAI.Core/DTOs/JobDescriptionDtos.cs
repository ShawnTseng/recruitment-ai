namespace RecruitmentAI.Core.DTOs;

public record CreateJobDescriptionRequest(
    string Title,
    string? RawText,
    Guid? ClientId = null
);

public record JobDescriptionResponse(
    Guid Id,
    Guid RecruiterId,
    Guid? ClientId,
    string? ClientName,
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
