using System.ComponentModel;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;

namespace RecruitmentAI.Plugins;

public class AnswerEvaluatorPlugin
{
    private const string SystemPrompt = """
        You are a technical recruitment evaluator. Score each candidate answer against the job requirements.

        Scoring Rubric (per question, 3 dimensions each scored 1-4):
        - Technical Depth: 4=Strong (specific details, real experience), 3=Acceptable, 2=Needs Probe (vague), 1=Insufficient (generic/no detail)
        - Specificity: 4=Mentions concrete tools, versions, metrics; 3=Some specifics; 2=Mostly generic; 1=No specifics
        - Relevance: 4=Directly addresses JD requirements; 3=Partially relevant; 2=Tangentially related; 1=Off-topic

        Red Flags to detect:
        - Answers that sound like AI-generated text (overly formal, generic best-practice lists)
        - Contradictions between answers
        - Claims that don't align with stated experience level
        - Vague answers that avoid specifics

        Return JSON:
        {
          "scores": [
            {
              "questionId": 1,
              "technicalDepth": { "score": 3, "label": "Acceptable", "comment": "..." },
              "specificity": { "score": 2, "label": "Needs Probe", "comment": "..." },
              "relevance": { "score": 4, "label": "Strong", "comment": "..." },
              "overallScore": 3.0
            }
          ],
          "redFlags": [
            { "questionId": 1, "type": "vague_answer", "description": "..." }
          ],
          "overallScore": 75,
          "confidence": 85,
          "recommendation": "Pass|Hold|Reject",
          "summary": "Brief overall assessment"
        }

        Return ONLY valid JSON, no markdown fences or extra text.
        """;

    [KernelFunction, Description("Scores candidate answers against the Rubric and detects red flags")]
    public async Task<string> EvaluateAnswersAsync(
        Kernel kernel,
        [Description("Candidate answers JSON")] string answersJson,
        [Description("JD requirements JSON")] string jdRequirementsJson,
        [Description("Rubric weights JSON")] string? rubricJson = null)
    {
        var chatService = kernel.GetRequiredService<IChatCompletionService>();
        var history = new ChatHistory(SystemPrompt);

        var userMessage = $"Evaluate these candidate answers against the JD requirements.\n\nJD Requirements:\n{jdRequirementsJson}\n\nCandidate Answers:\n{answersJson}";
        if (!string.IsNullOrWhiteSpace(rubricJson))
        {
            userMessage += $"\n\nCustom Rubric Weights:\n{rubricJson}";
        }
        history.AddUserMessage(userMessage);

        var response = await chatService.GetChatMessageContentAsync(history);
        return response.Content ?? "{ \"scores\": [], \"redFlags\": [], \"confidence\": 0 }";
    }
}
