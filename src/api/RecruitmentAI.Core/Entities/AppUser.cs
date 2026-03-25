namespace RecruitmentAI.Core.Entities;

public class AppUser
{
    public Guid Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public Guid? WorkspaceId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
