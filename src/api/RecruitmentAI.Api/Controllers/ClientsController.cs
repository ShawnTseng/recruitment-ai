using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RecruitmentAI.Core.DTOs;
using RecruitmentAI.Core.Entities;
using RecruitmentAI.Core.Interfaces;

namespace RecruitmentAI.Api.Controllers;

[ApiController]
[Route("api/clients")]
[Authorize(Roles = "Recruiter,SuperAdmin")]
public class ClientsController : ControllerBase
{
    private readonly IClientRepository _clientRepo;
    private readonly IRecruiterRepository _recruiterRepo;
    private readonly ILogger<ClientsController> _logger;

    public ClientsController(IClientRepository clientRepo, IRecruiterRepository recruiterRepo, ILogger<ClientsController> logger)
    {
        _clientRepo = clientRepo;
        _recruiterRepo = recruiterRepo;
        _logger = logger;
    }

    private Guid? GetWorkspaceId()
    {
        var str = User.FindFirstValue("workspaceId");
        return Guid.TryParse(str, out var id) ? id : null;
    }

    private async Task EnsureRecruiterExistsAsync(Guid workspaceId, CancellationToken ct)
    {
        var existing = await _recruiterRepo.GetByWorkspaceIdAsync(workspaceId, ct);
        if (existing is null)
        {
            await _recruiterRepo.AddAsync(new Recruiter
            {
                Id = workspaceId,
                Name = User.FindFirstValue("displayName") ?? "Recruiter",
                Email = $"{User.FindFirstValue(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.UniqueName)}@company.com",
                WorkspaceId = workspaceId,
            }, ct);
        }
    }

    /// <summary>GET /api/clients — list all clients in the recruiter's workspace</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var workspaceId = GetWorkspaceId();
        if (workspaceId is null) return Forbid();

        var clients = await _clientRepo.GetByWorkspaceAsync(workspaceId.Value, ct);
        return Ok(clients.Select(c => new ClientResponse(c.Id, c.Name, c.Description, c.WorkspaceId, c.CreatedAt)));
    }

    /// <summary>GET /api/clients/{id}</summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var workspaceId = GetWorkspaceId();
        if (workspaceId is null) return Forbid();

        var client = await _clientRepo.GetByIdAndWorkspaceAsync(id, workspaceId.Value, ct);
        if (client is null) return NotFound();
        return Ok(new ClientResponse(client.Id, client.Name, client.Description, client.WorkspaceId, client.CreatedAt));
    }

    /// <summary>POST /api/clients — create a new client</summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateClientRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new { message = "Client name is required." });

        var workspaceId = GetWorkspaceId();
        if (workspaceId is null) return Forbid();

        await EnsureRecruiterExistsAsync(workspaceId.Value, ct);

        var client = new Client
        {
            Id = Guid.NewGuid(),
            Name = request.Name.Trim(),
            Description = request.Description?.Trim(),
            WorkspaceId = workspaceId.Value,
        };

        await _clientRepo.AddAsync(client, ct);
        _logger.LogInformation("Client created: {ClientId} by workspace {WorkspaceId}", client.Id, workspaceId);
        return CreatedAtAction(nameof(GetById), new { id = client.Id },
            new ClientResponse(client.Id, client.Name, client.Description, client.WorkspaceId, client.CreatedAt));
    }

    /// <summary>PUT /api/clients/{id} — update client</summary>
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateClientRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new { message = "Client name is required." });

        var workspaceId = GetWorkspaceId();
        if (workspaceId is null) return Forbid();

        var client = await _clientRepo.GetByIdAndWorkspaceAsync(id, workspaceId.Value, ct);
        if (client is null) return NotFound();

        client.Name = request.Name.Trim();
        client.Description = request.Description?.Trim();
        await _clientRepo.UpdateAsync(client, ct);
        return Ok(new ClientResponse(client.Id, client.Name, client.Description, client.WorkspaceId, client.CreatedAt));
    }

    /// <summary>DELETE /api/clients/{id}</summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var workspaceId = GetWorkspaceId();
        if (workspaceId is null) return Forbid();

        var client = await _clientRepo.GetByIdAndWorkspaceAsync(id, workspaceId.Value, ct);
        if (client is null) return NotFound();

        await _clientRepo.DeleteAsync(client, ct);
        return NoContent();
    }
}
