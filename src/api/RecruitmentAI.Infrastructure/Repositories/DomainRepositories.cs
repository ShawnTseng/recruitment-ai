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

    public async Task<CandidateSubmission?> GetByIdWithChainAsync(Guid submissionId, CancellationToken ct = default)
        => await _db.CandidateSubmissions
            .Include(cs => cs.Questionnaire)
                .ThenInclude(q => q.JobDescription)
            .Include(cs => cs.EvaluationReports)
            .Include(cs => cs.InterviewGuide)
            .FirstOrDefaultAsync(cs => cs.Id == submissionId, ct);
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

public class InterviewGuideRepository : Repository<InterviewGuide>, IInterviewGuideRepository
{
    public InterviewGuideRepository(RecruitmentDbContext db) : base(db) { }

    public async Task<InterviewGuide?> GetBySubmissionAsync(Guid submissionId, CancellationToken ct = default)
        => await _db.InterviewGuides
            .FirstOrDefaultAsync(ig => ig.SubmissionId == submissionId, ct);
}

public class ClientFeedbackRepository : Repository<ClientFeedback>, IClientFeedbackRepository
{
    public ClientFeedbackRepository(RecruitmentDbContext db) : base(db) { }

    public async Task<IReadOnlyList<ClientFeedback>> GetByRecruiterAsync(Guid recruiterId, CancellationToken ct = default)
        => await _db.ClientFeedbacks
            .Where(cf => cf.RecruiterId == recruiterId)
            .OrderByDescending(cf => cf.CreatedAt)
            .ToListAsync(ct);
}

public class SystemParameterRepository : ISystemParameterRepository
{
    private readonly RecruitmentDbContext _db;
    public SystemParameterRepository(RecruitmentDbContext db) => _db = db;

    public async Task<IReadOnlyList<SystemParameter>> GetAllAsync(CancellationToken ct = default)
        => await _db.SystemParameters.OrderBy(sp => sp.Key).ToListAsync(ct);

    public async Task<SystemParameter?> GetByKeyAsync(string key, CancellationToken ct = default)
        => await _db.SystemParameters.FindAsync([key], ct);

    public async Task UpsertAsync(SystemParameter param, CancellationToken ct = default)
    {
        var existing = await _db.SystemParameters.FindAsync([param.Key], ct);
        if (existing is null)
            _db.SystemParameters.Add(param);
        else
        {
            existing.Value = param.Value;
            existing.UpdatedBy = param.UpdatedBy;
            existing.UpdatedAt = param.UpdatedAt;
        }
        await _db.SaveChangesAsync(ct);
    }

    public async Task<bool> DeleteAsync(string key, CancellationToken ct = default)
    {
        var existing = await _db.SystemParameters.FindAsync([key], ct);
        if (existing is null) return false;
        _db.SystemParameters.Remove(existing);
        await _db.SaveChangesAsync(ct);
        return true;
    }
}

public class TalentPoolRepository : ITalentPoolRepository
{
    private readonly RecruitmentDbContext _db;
    public TalentPoolRepository(RecruitmentDbContext db) => _db = db;

    public async Task<IReadOnlyList<Candidate>> SearchAsync(
        string? skillKeyword,
        double? minScore,
        CancellationToken ct = default)
    {
        var query = _db.Candidates
            .Include(c => c.Submissions)
                .ThenInclude(s => s.EvaluationReports)
            .Include(c => c.ClientFeedbacks)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(skillKeyword))
            query = query.Where(c => c.SkillTags.Contains(skillKeyword)
                                  || c.Name.Contains(skillKeyword));

        if (minScore.HasValue)
            query = query.Where(c => c.Submissions
                .SelectMany(s => s.EvaluationReports)
                .Any(er => er.AiScore >= minScore.Value));

        return await query
            .OrderByDescending(c => c.CreatedAt)
            .Take(100)
            .ToListAsync(ct);
    }
}
