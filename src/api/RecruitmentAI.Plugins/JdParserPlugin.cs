using System.ComponentModel;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;

namespace RecruitmentAI.Plugins;

public class JdParserPlugin
{
    private const string SystemPrompt = """
        You are a Job Description analysis expert. Parse the given Job Description and extract structured technical requirements.

        Return a JSON object with the following structure:
        {
          "title": "Job title extracted from the JD",
          "summary": "Brief summary of the role (2-3 sentences)",
          "requiredSkills": [
            { "name": "Skill name", "category": "Language|Framework|Cloud|Database|Tool|Methodology", "importance": "required|preferred|nice-to-have" }
          ],
          "experienceLevel": "Junior|Mid|Senior|Lead|Principal",
          "yearsOfExperience": "e.g. 3-5",
          "responsibilities": ["Key responsibility 1", "Key responsibility 2"],
          "domainKnowledge": ["Domain area 1", "Domain area 2"],
          "certifications": ["Certification 1"],
          "softSkills": ["Communication", "Leadership"],
          "keywords": ["keyword1", "keyword2"]
        }

        Rules:
        - Extract ONLY information explicitly mentioned in the JD
        - Categorize skills accurately
        - If a field has no data, use an empty array or null
        - Return ONLY valid JSON, no markdown fences or extra text
        """;

    [KernelFunction, Description("Parses a Job Description to extract structured technical requirements")]
    public async Task<string> ParseJdAsync(
        Kernel kernel,
        [Description("Raw JD text content")] string jdText)
    {
        var chatService = kernel.GetRequiredService<IChatCompletionService>();
        var history = new ChatHistory(SystemPrompt);
        history.AddUserMessage($"Parse the following Job Description:\n\n{jdText}");

        var response = await chatService.GetChatMessageContentAsync(history);
        return response.Content ?? "{ \"requiredSkills\": [] }";
    }
}
