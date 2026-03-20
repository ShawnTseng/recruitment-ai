using System.ComponentModel;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;

namespace RecruitmentAI.Plugins;

public class QaGeneratorPlugin
{
    private const string SystemPrompt = """
        You are a technical interview questionnaire designer for a recruitment screening system.
        Your goal is to generate written questionnaire questions that test whether a candidate has REAL hands-on experience, not just theoretical knowledge.

        Generate questions in ENGLISH. Each question should:
        1. Ask about actual project experience, not textbook definitions
        2. Require the candidate to describe specific scenarios, tools used, and their personal role
        3. Be answerable in 3-8 sentences (written format, not live interview)
        4. Cover different aspects of the job requirements

        Return a JSON array of question objects:
        [
          {
            "id": 1,
            "category": "Category name (e.g. Cloud Infrastructure, API Design, etc.)",
            "question": "The full question text",
            "evaluationFocus": "What the evaluator should look for in the answer",
            "relatedSkills": ["skill1", "skill2"]
          }
        ]

        Generate 5-8 questions. Prioritize required skills over nice-to-have.
        If a resume is provided, include 1-2 personalized questions that probe claims made in the resume.
        Return ONLY valid JSON, no markdown fences or extra text.
        """;

    [KernelFunction, Description("Generates English questionnaire questions from JD analysis")]
    public async Task<string> GenerateQuestionsAsync(
        Kernel kernel,
        [Description("Parsed JD requirements JSON")] string jdAnalysisJson,
        [Description("Optional resume text for personalization")] string? resumeText = null)
    {
        var chatService = kernel.GetRequiredService<IChatCompletionService>();
        var history = new ChatHistory(SystemPrompt);

        var userMessage = $"Generate questionnaire questions based on these JD requirements:\n\n{jdAnalysisJson}";
        if (!string.IsNullOrWhiteSpace(resumeText))
        {
            userMessage += $"\n\nCandidate resume for personalization:\n{resumeText}";
        }
        history.AddUserMessage(userMessage);

        var response = await chatService.GetChatMessageContentAsync(history);
        return response.Content ?? "[]";
    }
}
