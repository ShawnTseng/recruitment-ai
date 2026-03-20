namespace RecruitmentAI.Core.Entities;

public class InterviewGuide
{
    public Guid Id { get; set; }
    public Guid SubmissionId { get; set; }
    public string GuideJson { get; set; } = "{}";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public CandidateSubmission Submission { get; set; } = null!;
}
