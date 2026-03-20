using Microsoft.EntityFrameworkCore;
using RecruitmentAI.Core.Entities;

namespace RecruitmentAI.Infrastructure.Data;

public class RecruitmentDbContext : DbContext
{
    public RecruitmentDbContext(DbContextOptions<RecruitmentDbContext> options) : base(options) { }

    public DbSet<Recruiter> Recruiters => Set<Recruiter>();
    public DbSet<JobDescription> JobDescriptions => Set<JobDescription>();
    public DbSet<Candidate> Candidates => Set<Candidate>();
    public DbSet<Questionnaire> Questionnaires => Set<Questionnaire>();
    public DbSet<CandidateSubmission> CandidateSubmissions => Set<CandidateSubmission>();
    public DbSet<EvaluationReport> EvaluationReports => Set<EvaluationReport>();
    public DbSet<InterviewGuide> InterviewGuides => Set<InterviewGuide>();
    public DbSet<ClientFeedback> ClientFeedbacks => Set<ClientFeedback>();
    public DbSet<PromptVersion> PromptVersions => Set<PromptVersion>();
    public DbSet<SystemParameter> SystemParameters => Set<SystemParameter>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<SystemParameter>()
            .HasKey(sp => sp.Key);

        modelBuilder.Entity<CandidateSubmission>()
            .HasIndex(cs => cs.Token)
            .IsUnique()
            .HasFilter("[Token] IS NOT NULL");

        modelBuilder.Entity<Candidate>()
            .HasIndex(c => c.WorkspaceId);

        modelBuilder.Entity<JobDescription>()
            .HasIndex(jd => jd.RecruiterId);

        modelBuilder.Entity<InterviewGuide>()
            .HasOne(ig => ig.Submission)
            .WithOne(cs => cs.InterviewGuide)
            .HasForeignKey<InterviewGuide>(ig => ig.SubmissionId);
    }
}
