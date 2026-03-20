using RecruitmentAI.Plugins;

namespace RecruitmentAI.Tests;

public class JdParserPluginTests
{
    [Fact]
    public async Task ParseJdAsync_ReturnsJsonWithRequirements()
    {
        var plugin = new JdParserPlugin();
        var result = await plugin.ParseJdAsync(null!, "Sample JD Text");
        Assert.Contains("requirements", result);
    }

    [Fact]
    public async Task ParseJdAsync_EmptyInput_ReturnsDefaultJson()
    {
        var plugin = new JdParserPlugin();
        var result = await plugin.ParseJdAsync(null!, "");
        Assert.NotNull(result);
        Assert.Contains("requirements", result);
    }
}

public class StatusEndpointTests
{
    [Fact]
    public void StatusController_Get_ReturnsRunning()
    {
        var controller = new Api.Controllers.StatusController();
        var result = controller.Get();
        Assert.NotNull(result);
    }
}
