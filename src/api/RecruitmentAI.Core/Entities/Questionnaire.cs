namespace RecruitmentAI.Core.Entities;

public class Questionnaire
{
    public Guid Id { get; set; }
    public Guid JobDescriptionId { get; set; }
    public string? TemplateVersion { get; set; }
    public string QuestionsJson { get; set; } = "[]";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public JobDescription JobDescription { get; set; } = null!;
    public ICollection<CandidateSubmission> Submissions { get; set; } = [];
}
