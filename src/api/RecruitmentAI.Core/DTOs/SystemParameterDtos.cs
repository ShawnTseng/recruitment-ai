namespace RecruitmentAI.Core.DTOs;

public record SystemParameterResponse(
    string Key,
    string Value,
    string? UpdatedBy,
    DateTime UpdatedAt
);

public record UpsertSystemParameterRequest(
    string Value,
    string? UpdatedBy
);
