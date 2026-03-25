using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RecruitmentAI.Core.DTOs;
using RecruitmentAI.Core.Entities;
using RecruitmentAI.Core.Interfaces;

namespace RecruitmentAI.Api.Controllers;

[ApiController]
[Route("api/clients")]
[Authorize(Roles = "Recruiter,Manager,AccountManager,SuperAdmin")]
public class ClientsController : ControllerBase
{
    private readonly IClientRepository _clientRepo;
    private readonly ILogger<ClientsController> _logger;

    public ClientsController(IClientRepository clientRepo, ILogger<ClientsController> logger)
    {
        _clientRepo = clientRepo;
        _logger = logger;
    }

    private static ClientResponse ToResponse(Client c)
        => new(c.Id, c.Name, c.Description, c.WorkspaceId, c.CreatedAt);

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var clients = await _clientRepo.GetAllAsync(ct);
        return Ok(clients.Select(ToResponse));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var client = await _clientRepo.GetByIdAsync(id, ct);
        if (client is null) return NotFound();
        return Ok(ToResponse(client));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateClientRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new { message = "Client name is required." });

        var client = new Client
        {
            Id = Guid.NewGuid(),
            Name = request.Name.Trim(),
            Description = request.Description?.Trim(),
            WorkspaceId = Guid.Empty,
        };

        await _clientRepo.AddAsync(client, ct);
        _logger.LogInformation("Client created: {ClientId} by user {User}", client.Id, User.Identity?.Name);
        return CreatedAtAction(nameof(GetById), new { id = client.Id }, ToResponse(client));
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateClientRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new { message = "Client name is required." });

        var client = await _clientRepo.GetByIdAsync(id, ct);
        if (client is null) return NotFound();

        client.Name = request.Name.Trim();
        client.Description = request.Description?.Trim();
        await _clientRepo.UpdateAsync(client, ct);
        return Ok(ToResponse(client));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var client = await _clientRepo.GetByIdAsync(id, ct);
        if (client is null) return NotFound();

        await _clientRepo.DeleteAsync(client, ct);
        return NoContent();
    }
}
