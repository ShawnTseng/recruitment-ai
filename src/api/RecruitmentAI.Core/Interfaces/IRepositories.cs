using RecruitmentAI.Core.Entities;

namespace RecruitmentAI.Core.Interfaces;

public interface IWorkspaceRepository<T> : IRepository<T> where T : class
{
    Task<IReadOnlyList<T>> GetAllByWorkspaceAsync(Guid workspaceId, CancellationToken ct = default);
}

public interface IJobDescriptionRepository : IWorkspaceRepository<JobDescription>
{
    Task<IReadOnlyList<JobDescription>> GetByRecruiterAsync(Guid recruiterId, CancellationToken ct = default);
}

public interface ICandidateRepository : IWorkspaceRepository<Candidate>
{
}

public interface ICandidateSubmissionRepository : IRepository<CandidateSubmission>
{
    Task<CandidateSubmission?> GetByTokenAsync(string token, CancellationToken ct = default);
}

public interface IBlobStorageService
{
    Task<string> UploadAsync(string containerName, string fileName, Stream content, string contentType, CancellationToken ct = default);
    Task<Stream> DownloadAsync(string containerName, string blobName, CancellationToken ct = default);
}
