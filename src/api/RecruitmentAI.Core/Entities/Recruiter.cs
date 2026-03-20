namespace RecruitmentAI.Core.Entities;

public class Recruiter
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public Guid WorkspaceId { get; set; }
    public string Role { get; set; } = "Recruiter";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<JobDescription> JobDescriptions { get; set; } = [];
    public ICollection<ClientFeedback> ClientFeedbacks { get; set; } = [];
}
