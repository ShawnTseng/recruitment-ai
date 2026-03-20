using System.ComponentModel;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;

namespace RecruitmentAI.Plugins;

public class FeedbackLoopPlugin
{
    private const string SystemPrompt = """
        You are a recruitment AI calibration analyst. Analyze client feedback patterns to identify areas where the screening prompts can be improved.

        Given the feedback history (candidate outcomes: Hired/Rejected/Declined) and the current prompt version, identify:
        1. False positives: Candidates who passed AI screening but were rejected by the client
        2. Patterns in rejected candidates' answers that the AI should have flagged
        3. Specific prompt improvements to reduce false positives/negatives

        Return JSON:
        {
          "patterns": [
            { "type": "false_positive|false_negative|bias", "description": "...", "frequency": 5, "severity": "high|medium|low" }
          ],
          "suggestions": [
            { "plugin": "QaGeneratorPlugin|AnswerEvaluatorPlugin", "change": "...", "rationale": "...", "priority": "high|medium|low" }
          ],
          "promptDraft": "Optional improved prompt text if a high-priority change is suggested",
          "accuracy": { "current": 78, "estimatedAfterChanges": 85 }
        }

        Return ONLY valid JSON, no markdown fences or extra text.
        """;

    [KernelFunction, Description("Analyzes client feedback patterns and suggests Prompt improvements")]
    public async Task<string> AnalyzeFeedbackAsync(
        Kernel kernel,
        [Description("Client feedback entries JSON")] string feedbackJson,
        [Description("Current active prompt version")] string currentPromptVersion)
    {
        var chatService = kernel.GetRequiredService<IChatCompletionService>();
        var history = new ChatHistory(SystemPrompt);
        history.AddUserMessage($"Analyze this feedback data and the current prompt version '{currentPromptVersion}':\n\n{feedbackJson}");

        var response = await chatService.GetChatMessageContentAsync(history);
        return response.Content ?? "{ \"patterns\": [], \"suggestions\": [] }";
    }
}
