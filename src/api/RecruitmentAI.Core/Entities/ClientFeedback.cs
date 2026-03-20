namespace RecruitmentAI.Core.Entities;

public class ClientFeedback
{
    public Guid Id { get; set; }
    public Guid CandidateId { get; set; }
    public Guid JobDescriptionId { get; set; }
    public Guid RecruiterId { get; set; }
    public string Outcome { get; set; } = string.Empty; // Hired / Rejected at Client / Offer Declined
    public string Tags { get; set; } = "[]"; // JSON array of tags
    public string? Comments { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Candidate Candidate { get; set; } = null!;
    public JobDescription JobDescription { get; set; } = null!;
    public Recruiter Recruiter { get; set; } = null!;
}
