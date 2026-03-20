using Microsoft.AspNetCore.Mvc;

namespace RecruitmentAI.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StatusController : ControllerBase
{
    [HttpGet]
    public IActionResult Get()
    {
        return Ok(new
        {
            service = "RecruitmentAI API",
            status = "running",
            timestamp = DateTime.UtcNow
        });
    }
}
