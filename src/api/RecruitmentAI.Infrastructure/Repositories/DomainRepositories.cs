using Microsoft.EntityFrameworkCore;
using RecruitmentAI.Core.Entities;
using RecruitmentAI.Core.Interfaces;
using RecruitmentAI.Infrastructure.Data;

namespace RecruitmentAI.Infrastructure.Repositories;

public class JobDescriptionRepository : Repository<JobDescription>, IJobDescriptionRepository
{
    public JobDescriptionRepository(RecruitmentDbContext db) : base(db) { }

    public async Task<IReadOnlyList<JobDescription>> GetAllByWorkspaceAsync(Guid workspaceId, CancellationToken ct = default)
        => await _db.JobDescriptions
            .Where(jd => jd.Recruiter.WorkspaceId == workspaceId)
            .ToListAsync(ct);

    public async Task<IReadOnlyList<JobDescription>> GetByRecruiterAsync(Guid recruiterId, CancellationToken ct = default)
        => await _db.JobDescriptions
            .Where(jd => jd.RecruiterId == recruiterId)
            .ToListAsync(ct);
}

public class CandidateRepository : Repository<Candidate>, ICandidateRepository
{
    public CandidateRepository(RecruitmentDbContext db) : base(db) { }

    public async Task<IReadOnlyList<Candidate>> GetAllByWorkspaceAsync(Guid workspaceId, CancellationToken ct = default)
        => await _db.Candidates
            .Where(c => c.WorkspaceId == workspaceId)
            .ToListAsync(ct);
}

public class CandidateSubmissionRepository : Repository<CandidateSubmission>, ICandidateSubmissionRepository
{
    public CandidateSubmissionRepository(RecruitmentDbContext db) : base(db) { }

    public async Task<CandidateSubmission?> GetByTokenAsync(string token, CancellationToken ct = default)
        => await _db.CandidateSubmissions
            .Include(cs => cs.Questionnaire)
                .ThenInclude(q => q.JobDescription)
            .FirstOrDefaultAsync(cs => cs.Token == token && !cs.TokenUsed && cs.TokenExpiresAt > DateTime.UtcNow, ct);

    public async Task<IReadOnlyList<CandidateSubmission>> GetByCandidateAsync(Guid candidateId, CancellationToken ct = default)
        => await _db.CandidateSubmissions
            .Where(cs => cs.CandidateId == candidateId)
            .ToListAsync(ct);
}

public class QuestionnaireRepository : Repository<Questionnaire>, IQuestionnaireRepository
{
    public QuestionnaireRepository(RecruitmentDbContext db) : base(db) { }

    public async Task<IReadOnlyList<Questionnaire>> GetByJobDescriptionAsync(Guid jobDescriptionId, CancellationToken ct = default)
        => await _db.Questionnaires
            .Where(q => q.JobDescriptionId == jobDescriptionId)
            .ToListAsync(ct);
}

public class RecruiterRepository : Repository<Recruiter>, IRecruiterRepository
{
    public RecruiterRepository(RecruitmentDbContext db) : base(db) { }

    public async Task<Recruiter?> GetByEmailAsync(string email, CancellationToken ct = default)
        => await _db.Recruiters
            .FirstOrDefaultAsync(r => r.Email == email, ct);
}

public class EvaluationReportRepository : Repository<EvaluationReport>, IEvaluationReportRepository
{
    public EvaluationReportRepository(RecruitmentDbContext db) : base(db) { }

    public async Task<IReadOnlyList<EvaluationReport>> GetBySubmissionAsync(Guid submissionId, CancellationToken ct = default)
        => await _db.EvaluationReports
            .Where(er => er.SubmissionId == submissionId)
            .ToListAsync(ct);
}
