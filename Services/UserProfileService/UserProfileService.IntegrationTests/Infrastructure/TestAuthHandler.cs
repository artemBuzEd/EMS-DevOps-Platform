using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace UserProfileService.IntegrationTests.Infrastructure;

public class TestAuthHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
    public const string SchemeName = "Test";
    
    public TestAuthHandler(
        IOptionsMonitor<AuthenticationSchemeOptions> options, 
        ILoggerFactory logger, 
        UrlEncoder encoder)
        : base(options, logger, encoder) { }

    public const string DefaultSub = "test-user-sub";

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        // Default principal: the canonical test user, admin. Tests that need to act as a
        // different user (impersonation / non-owner cases) or drop admin override via headers:
        //   X-Test-Sub:   the NameIdentifier claim (who the caller is)
        //   X-Test-Roles: comma-separated roles; when present it REPLACES the default "admin"
        var sub = Request.Headers.TryGetValue("X-Test-Sub", out var subVal) && !string.IsNullOrEmpty(subVal)
            ? subVal.ToString()
            : DefaultSub;

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, sub),
            new("preferred_username", "testuser"),
            new("given_name", "Test"),
            new("family_name", "User"),
        };

        if (Request.Headers.TryGetValue("X-Test-Roles", out var rolesVal))
        {
            foreach (var role in rolesVal.ToString()
                         .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
                claims.Add(new Claim(ClaimTypes.Role, role));
        }
        else
        {
            claims.Add(new Claim(ClaimTypes.Role, "admin"));
        }

        var identity = new ClaimsIdentity(claims, "Test");
        var ticket = new AuthenticationTicket(new ClaimsPrincipal(identity), "Test");
        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}