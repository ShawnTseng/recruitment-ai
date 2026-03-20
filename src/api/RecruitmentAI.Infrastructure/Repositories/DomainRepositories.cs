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
            .FirstOrDefaultAsync(cs => cs.Token == token && !cs.TokenUsed && cs.TokenExpiresAt > DateTime.UtcNow, ct);
}
