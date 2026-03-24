using RecruitmentAI.Core.Entities;

namespace RecruitmentAI.Core.Interfaces;

public interface IWorkspaceRepository<T> : IRepository<T> where T : class
{
    Task<IReadOnlyList<T>> GetAllByWorkspaceAsync(Guid workspaceId, CancellationToken ct = default);
}

public interface IJobDescriptionRepository : IWorkspaceRepository<JobDescription>
{
    Task<IReadOnlyList<JobDescription>> GetByRecruiterAsync(Guid recruiterId, CancellationToken ct = default);
    Task<IReadOnlyList<JobDescription>> GetByClientAsync(Guid clientId, Guid workspaceId, CancellationToken ct = default);
}

public interface ICandidateRepository : IWorkspaceRepository<Candidate>
{
}

public interface ICandidateSubmissionRepository : IRepository<CandidateSubmission>
{
    Task<CandidateSubmission?> GetByTokenAsync(string token, CancellationToken ct = default);
    Task<IReadOnlyList<CandidateSubmission>> GetByCandidateAsync(Guid candidateId, CancellationToken ct = default);
    /// <summary>Loads submission with Questionnaire → JobDescription chain.</summary>
    Task<CandidateSubmission?> GetByIdWithChainAsync(Guid submissionId, CancellationToken ct = default);
}

public interface IQuestionnaireRepository : IRepository<Questionnaire>
{
    Task<IReadOnlyList<Questionnaire>> GetByJobDescriptionAsync(Guid jobDescriptionId, CancellationToken ct = default);
}

public interface IRecruiterRepository : IRepository<Recruiter>
{
    Task<Recruiter?> GetByEmailAsync(string email, CancellationToken ct = default);
    Task<Recruiter?> GetByWorkspaceIdAsync(Guid workspaceId, CancellationToken ct = default);
}

/// <summary>Clients are a shared resource — not scoped per workspace.</summary>
public interface IClientRepository : IRepository<Client>
{
    // GetAllAsync and GetByIdAsync are inherited from IRepository<Client>
}

public interface IEvaluationReportRepository : IRepository<EvaluationReport>
{
    Task<IReadOnlyList<EvaluationReport>> GetBySubmissionAsync(Guid submissionId, CancellationToken ct = default);
}

public interface IInterviewGuideRepository : IRepository<InterviewGuide>
{
    Task<InterviewGuide?> GetBySubmissionAsync(Guid submissionId, CancellationToken ct = default);
}

public interface IClientFeedbackRepository : IRepository<ClientFeedback>
{
    Task<IReadOnlyList<ClientFeedback>> GetByRecruiterAsync(Guid recruiterId, CancellationToken ct = default);
}

public interface ISystemParameterRepository
{
    Task<IReadOnlyList<SystemParameter>> GetAllAsync(CancellationToken ct = default);
    Task<SystemParameter?> GetByKeyAsync(string key, CancellationToken ct = default);
    Task UpsertAsync(SystemParameter param, CancellationToken ct = default);
    Task<bool> DeleteAsync(string key, CancellationToken ct = default);
}

public interface ITalentPoolRepository
{
    Task<IReadOnlyList<Candidate>> SearchAsync(
        string? skillKeyword,
        double? minScore,
        CancellationToken ct = default);
}

public interface IBlobStorageService
{
    Task<string> UploadAsync(string containerName, string fileName, Stream content, string contentType, CancellationToken ct = default);
    Task<Stream> DownloadAsync(string containerName, string blobName, CancellationToken ct = default);
}
