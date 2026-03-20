using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using RecruitmentAI.Core.Interfaces;

namespace RecruitmentAI.Infrastructure.Services;

public class AzureBlobStorageService : IBlobStorageService
{
    private readonly BlobServiceClient? _blobServiceClient;

    public AzureBlobStorageService(BlobServiceClient? blobServiceClient)
        => _blobServiceClient = blobServiceClient;

    public async Task<string> UploadAsync(string containerName, string fileName, Stream content, string contentType, CancellationToken ct = default)
    {
        if (_blobServiceClient is null)
            throw new InvalidOperationException("Blob Storage is not configured. Set BlobStorage:Endpoint.");
        var containerClient = _blobServiceClient.GetBlobContainerClient(containerName);
        await containerClient.CreateIfNotExistsAsync(cancellationToken: ct);
        var blobClient = containerClient.GetBlobClient(fileName);

        await blobClient.UploadAsync(content, new BlobHttpHeaders { ContentType = contentType }, cancellationToken: ct);
        return blobClient.Uri.ToString();
    }

    public async Task<Stream> DownloadAsync(string containerName, string blobName, CancellationToken ct = default)
    {
        if (_blobServiceClient is null)
            throw new InvalidOperationException("Blob Storage is not configured.");
        var containerClient = _blobServiceClient.GetBlobContainerClient(containerName);
        var blobClient = containerClient.GetBlobClient(blobName);
        var download = await blobClient.DownloadStreamingAsync(cancellationToken: ct);
        return download.Value.Content;
    }
}
