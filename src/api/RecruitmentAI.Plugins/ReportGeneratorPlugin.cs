using System.ComponentModel;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;

namespace RecruitmentAI.Plugins;

public class ReportGeneratorPlugin
{
    private const string Stage1Prompt = """
        You are a recruitment report generator. Create a Stage 1 Candidate Evaluation Report in Markdown format.

        The report must include:
        1. **Overall Recommendation**: Pass / Hold / Reject with confidence score (0-100)
        2. **Technical Fit Summary**: For each JD requirement, state: Confirmed / Partial / Missing
        3. **Red Flags**: List any vague, contradictory, or suspected AI-generated answers
        4. **Suggested Follow-up Questions**: 3-5 probe questions for the recruiter
        5. **Score Breakdown**: Table of per-question scores

        Return JSON:
        {
          "recommendation": "Pass|Hold|Reject",
          "confidenceScore": 85,
          "reportMarkdown": "Full markdown report text",
          "followUpQuestions": ["Question 1", "Question 2"],
          "technicalFit": [
            { "requirement": "Azure", "status": "Confirmed", "evidence": "..." }
          ]
        }

        Return ONLY valid JSON, no markdown fences or extra text.
        """;

    private const string Stage2Prompt = """
        You are a technical interview guide generator. Create a Stage 2 Interview Guide for Taiwan-based technical interviewers.

        Based on the Stage 1 evaluation, generate:
        1. **Confirmed Strengths**: Areas where the candidate showed strong written evidence — verify in person
        2. **Areas to Probe**: Weak or vague answers that need deeper exploration
        3. **Suggested Interview Questions**: 5-8 targeted questions with expected good/bad answers
        4. **Technical Deep-dives**: 2-3 scenario-based questions relevant to the actual JD

        Return JSON:
        {
          "confirmedStrengths": [{ "area": "...", "evidence": "..." }],
          "areasToProbe": [{ "area": "...", "concern": "..." }],
          "interviewQuestions": [
            { "question": "...", "expectedGoodAnswer": "...", "redFlagAnswer": "..." }
          ],
          "estimatedDuration": "45 minutes",
          "guideMarkdown": "Full markdown guide text"
        }

        Return ONLY valid JSON, no markdown fences or extra text.
        """;

    [KernelFunction, Description("Generates Stage 1 Evaluation Report and Stage 2 Interview Guide")]
    public async Task<string> GenerateReportAsync(
        Kernel kernel,
        [Description("Evaluation results JSON")] string evaluationJson,
        [Description("Stage number (1 or 2)")] int stage)
    {
        var chatService = kernel.GetRequiredService<IChatCompletionService>();
        var systemPrompt = stage == 1 ? Stage1Prompt : Stage2Prompt;
        var history = new ChatHistory(systemPrompt);
        history.AddUserMessage($"Generate the Stage {stage} report based on this evaluation data:\n\n{evaluationJson}");

        var response = await chatService.GetChatMessageContentAsync(history);
        return response.Content ?? "{ \"report\": \"\" }";
    }
}
