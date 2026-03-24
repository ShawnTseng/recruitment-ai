using DocumentFormat.OpenXml.Packaging;
using UglyToad.PdfPig;
using UglyToad.PdfPig.Content;

namespace RecruitmentAI.Infrastructure.Services;

/// <summary>Extracts plain text content from uploaded files (PDF, DOCX, TXT).</summary>
public static class FileTextExtractorService
{
    private static readonly HashSet<string> AllowedExtensions = [".pdf", ".docx", ".txt"];
    private static readonly HashSet<string> AllowedMimeTypes =
    [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
    ];
    private const long MaxFileSize = 10 * 1024 * 1024; // 10MB

    public static bool IsValidFile(string fileName, string contentType, long fileSize, out string? errorMessage)
    {
        var ext = Path.GetExtension(fileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(ext))
        {
            errorMessage = "Only .pdf, .docx, and .txt files are supported.";
            return false;
        }
        if (!AllowedMimeTypes.Contains(contentType))
        {
            errorMessage = "Invalid file content type.";
            return false;
        }
        if (fileSize == 0 || fileSize > MaxFileSize)
        {
            errorMessage = "File is empty or exceeds 10MB limit.";
            return false;
        }
        errorMessage = null;
        return true;
    }

    /// <summary>Extracts text from a stream based on file extension.</summary>
    public static async Task<string> ExtractTextAsync(Stream stream, string fileName)
    {
        var ext = Path.GetExtension(fileName).ToLowerInvariant();
        return ext switch
        {
            ".pdf" => ExtractFromPdf(stream),
            ".docx" => ExtractFromDocx(stream),
            ".txt" => await ExtractFromTxtAsync(stream),
            _ => string.Empty,
        };
    }

    private static string ExtractFromPdf(Stream stream)
    {
        // Copy to MemoryStream because PdfPig requires seek support
        using var ms = new MemoryStream();
        stream.CopyTo(ms);
        ms.Position = 0;

        using var document = PdfDocument.Open(ms);
        var sb = new System.Text.StringBuilder();
        foreach (Page page in document.GetPages())
        {
            sb.AppendLine(page.Text);
        }
        return sb.ToString().Trim();
    }

    private static string ExtractFromDocx(Stream stream)
    {
        using var ms = new MemoryStream();
        stream.CopyTo(ms);
        ms.Position = 0;

        using var doc = WordprocessingDocument.Open(ms, false);
        var body = doc.MainDocumentPart?.Document?.Body;
        if (body is null) return string.Empty;

        var sb = new System.Text.StringBuilder();
        foreach (var para in body.Descendants<DocumentFormat.OpenXml.Wordprocessing.Paragraph>())
        {
            var text = para.InnerText;
            if (!string.IsNullOrWhiteSpace(text))
                sb.AppendLine(text);
        }
        return sb.ToString().Trim();
    }

    private static async Task<string> ExtractFromTxtAsync(Stream stream)
    {
        using var reader = new StreamReader(stream, leaveOpen: true);
        return (await reader.ReadToEndAsync()).Trim();
    }
}
