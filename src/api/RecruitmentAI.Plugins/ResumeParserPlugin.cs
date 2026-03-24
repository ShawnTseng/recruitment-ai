using System.ComponentModel;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;

namespace RecruitmentAI.Plugins;

public class ResumeParserPlugin
{
    private const string SystemPrompt = """
        You are a resume parsing expert. Extract candidate contact information from the provided resume text.

        Return a JSON object with ONLY the following fields:
        {
          "name": "Full name of the candidate",
          "email": "Email address of the candidate"
        }

        Rules:
        - Extract ONLY explicitly stated information
        - If name or email is not found, return an empty string for that field
        - Return ONLY valid JSON, no markdown fences or extra text
        - Name should be the full legal name (First + Last)
        """;

    [KernelFunction, Description("Extracts candidate name and email from resume text")]
    public async Task<string> ParseResumeAsync(
        Kernel kernel,
        [Description("Raw resume text content")] string resumeText)
    {
        var chatService = kernel.GetRequiredService<IChatCompletionService>();
        var history = new ChatHistory(SystemPrompt);
        history.AddUserMessage($"Extract the candidate's name and email from this resume:\n\n{resumeText}");

        var response = await chatService.GetChatMessageContentAsync(history);
        return response.Content ?? "{ \"name\": \"\", \"email\": \"\" }";
    }
}
