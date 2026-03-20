namespace RecruitmentAI.Core.Entities;

public class CandidateSubmission
{
    public Guid Id { get; set; }
    public Guid CandidateId { get; set; }
    public Guid QuestionnaireId { get; set; }
    public string AnswersJson { get; set; } = "[]";
    public string? Token { get; set; }
    public DateTime? TokenExpiresAt { get; set; }
    public bool TokenUsed { get; set; }
    public DateTime? SubmittedAt { get; set; }

    public Candidate Candidate { get; set; } = null!;
    public Questionnaire Questionnaire { get; set; } = null!;
    public ICollection<EvaluationReport> EvaluationReports { get; set; } = [];
    public InterviewGuide? InterviewGuide { get; set; }
}
