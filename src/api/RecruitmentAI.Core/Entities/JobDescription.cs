namespace RecruitmentAI.Core.Entities;

public class JobDescription
{
    public Guid Id { get; set; }
    public Guid RecruiterId { get; set; }
    public Guid? ClientId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string RawText { get; set; } = string.Empty;
    public string? BlobUrl { get; set; }
    public string? ParsedJson { get; set; }
    public string? PromptVersion { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Recruiter Recruiter { get; set; } = null!;
    public Client? Client { get; set; }
    public ICollection<Questionnaire> Questionnaires { get; set; } = [];
    public ICollection<ClientFeedback> ClientFeedbacks { get; set; } = [];
}
