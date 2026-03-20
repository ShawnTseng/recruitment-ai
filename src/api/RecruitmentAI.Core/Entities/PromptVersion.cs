namespace RecruitmentAI.Core.Entities;

public class PromptVersion
{
    public Guid Id { get; set; }
    public string PluginName { get; set; } = string.Empty;
    public string Version { get; set; } = "1.0";
    public string PromptText { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
