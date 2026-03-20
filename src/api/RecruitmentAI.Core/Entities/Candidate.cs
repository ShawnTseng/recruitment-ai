namespace RecruitmentAI.Core.Entities;

public class Candidate
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? ResumeBlobUrl { get; set; }
    public Guid WorkspaceId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<CandidateSubmission> Submissions { get; set; } = [];
    public ICollection<ClientFeedback> ClientFeedbacks { get; set; } = [];
}
