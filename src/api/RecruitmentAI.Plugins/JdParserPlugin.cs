using System.ComponentModel;
using Microsoft.SemanticKernel;

namespace RecruitmentAI.Plugins;

public class JdParserPlugin
{
    [KernelFunction, Description("Parses a Job Description to extract structured technical requirements")]
    public async Task<string> ParseJdAsync(
        Kernel kernel,
        [Description("Raw JD text content")] string jdText)
    {
        // TODO: Implement JD parsing with Azure OpenAI
        await Task.CompletedTask;
        return "{ \"requirements\": [] }";
    }
}
