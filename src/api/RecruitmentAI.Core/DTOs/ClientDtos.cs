namespace RecruitmentAI.Core.DTOs;

public record CreateClientRequest(string Name, string? Description);
public record UpdateClientRequest(string Name, string? Description);
public record ClientResponse(Guid Id, string Name, string? Description, Guid WorkspaceId, DateTime CreatedAt);
