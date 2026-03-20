using System.ComponentModel;
using System.Text.Json;
using Microsoft.SemanticKernel;

namespace RecruitmentAI.Plugins;

public class BusinessValuePlugin
{
    [KernelFunction, Description("Calculates time-saving and quality metrics for Manager Dashboard")]
    public Task<string> CalculateMetricsAsync(
        Kernel kernel,
        [Description("Monthly statistics JSON")] string monthlyStatsJson,
        [Description("Recruiter hourly rate")] decimal hourlyRate)
    {
        using var doc = JsonDocument.Parse(monthlyStatsJson);
        var root = doc.RootElement;

        var candidatesScreened = root.TryGetProperty("candidatesScreened", out var cs) ? cs.GetInt32() : 0;
        var avgMinutesPerManualScreen = root.TryGetProperty("avgMinutesPerManualScreen", out var am) ? am.GetInt32() : 45;
        var avgMinutesWithAi = root.TryGetProperty("avgMinutesWithAi", out var ai) ? ai.GetInt32() : 10;
        var passRate = root.TryGetProperty("passRate", out var pr) ? pr.GetDouble() : 0;
        var clientSatisfaction = root.TryGetProperty("clientSatisfaction", out var csat) ? csat.GetDouble() : 0;

        var minutesSaved = candidatesScreened * (avgMinutesPerManualScreen - avgMinutesWithAi);
        var hoursSaved = Math.Round(minutesSaved / 60.0, 1);
        var costSavings = Math.Round(hoursSaved * (double)hourlyRate, 2);

        var result = new
        {
            hoursSaved,
            costSavings,
            candidatesScreened,
            passRate,
            clientSatisfaction,
            efficiencyGain = avgMinutesPerManualScreen > 0
                ? Math.Round((1 - (double)avgMinutesWithAi / avgMinutesPerManualScreen) * 100, 1)
                : 0
        };

        return Task.FromResult(JsonSerializer.Serialize(result));
    }
}
