using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using RecruitmentAI.Core.DTOs;
using RecruitmentAI.Core.Entities;

namespace RecruitmentAI.Api.Controllers;

[ApiController]
[Route("api/auth")]
[AllowAnonymous]
public class AuthController : ControllerBase
{
    private static readonly Dictionary<string, (string DisplayName, Guid? WorkspaceId)> DemoUsers = new()
    {
        ["Recruiter"]       = ("Demo Recruiter",         Guid.Parse("00000000-0000-0000-0000-000000000001")),
        ["Interviewer"]     = ("Demo Interviewer",       null),
        ["Manager"]         = ("Demo Manager",           null),
        ["AccountManager"]  = ("Demo Account Manager",  null),
        ["SuperAdmin"]      = ("Demo Super Admin",       null),
    };

    private readonly IConfiguration _config;

    public AuthController(IConfiguration config) => _config = config;

    [HttpPost("demo-login")]
    public IActionResult DemoLogin([FromBody] DemoLoginRequest req)
    {
        if (!DemoUsers.TryGetValue(req.Role, out var info))
            return BadRequest(new { message = "Invalid role." });

        var user = new AppUser
        {
            Id = Guid.Parse($"00000000-0000-0000-0000-{DemoUsers.Keys.ToList().IndexOf(req.Role) + 1:D12}"),
            Username = $"demo_{req.Role.ToLower()}",
            Role = req.Role,
            DisplayName = info.DisplayName,
            WorkspaceId = info.WorkspaceId,
        };

        var token = GenerateJwt(user);
        return Ok(new LoginResponse(token, user.Role, user.DisplayName, user.WorkspaceId));
    }

    private string GenerateJwt(AppUser user)
    {
        var secret = _config["Jwt:SecretKey"];
        if (string.IsNullOrWhiteSpace(secret))
            throw new InvalidOperationException("Jwt:SecretKey is not configured.");

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.UniqueName, user.Username),
            new Claim(ClaimTypes.Role, user.Role),
            new Claim("displayName", user.DisplayName),
            new Claim("workspaceId", user.WorkspaceId?.ToString() ?? ""),
        };

        var token = new JwtSecurityToken(
            claims: claims,
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
