namespace RecruitmentAI.Core.Entities;

public class EvaluationReport
{
    public Guid Id { get; set; }
    public Guid SubmissionId { get; set; }
    public int Stage { get; set; } // 1 or 2
    public double AiScore { get; set; }
    public string Recommendation { get; set; } = string.Empty; // Pass / Hold / Reject
    public string ReportJson { get; set; } = "{}";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public CandidateSubmission Submission { get; set; } = null!;
}
