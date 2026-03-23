using Microsoft.AspNetCore.Mvc;
using RecruitmentAI.Core.DTOs;
using RecruitmentAI.Core.Entities;
using RecruitmentAI.Core.Interfaces;

namespace RecruitmentAI.Api.Controllers;

[ApiController]
[Route("api/system-parameters")]
public class SystemParametersController : ControllerBase
{
    private readonly ISystemParameterRepository _repo;

    public SystemParametersController(ISystemParameterRepository repo) => _repo = repo;

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<SystemParameterResponse>>> GetAll(CancellationToken ct)
    {
        var items = await _repo.GetAllAsync(ct);
        return Ok(items.Select(ToResponse));
    }

    [HttpGet("{key}")]
    public async Task<ActionResult<SystemParameterResponse>> GetByKey(string key, CancellationToken ct)
    {
        var item = await _repo.GetByKeyAsync(key, ct);
        return item is null ? NotFound() : Ok(ToResponse(item));
    }

    [HttpPut("{key}")]
    public async Task<ActionResult<SystemParameterResponse>> Upsert(
        string key,
        [FromBody] UpsertSystemParameterRequest request,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Value))
            return BadRequest("Value is required.");

        var param = new SystemParameter
        {
            Key = key,
            Value = request.Value,
            UpdatedBy = request.UpdatedBy,
            UpdatedAt = DateTime.UtcNow,
        };

        await _repo.UpsertAsync(param, ct);
        return Ok(ToResponse(param));
    }

    [HttpDelete("{key}")]
    public async Task<IActionResult> Delete(string key, CancellationToken ct)
    {
        var deleted = await _repo.DeleteAsync(key, ct);
        return deleted ? NoContent() : NotFound();
    }

    private static SystemParameterResponse ToResponse(SystemParameter sp) =>
        new(sp.Key, sp.Value, sp.UpdatedBy, sp.UpdatedAt);
}
