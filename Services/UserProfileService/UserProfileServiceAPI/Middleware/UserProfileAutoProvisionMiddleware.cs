using System.Security.Claims;
using BLL.DTOs.Request.UserProfile;
using BLL.Services.Contracts;

namespace WebApplication1.Middleware;

public class UserProfileAutoProvisionMiddleware
{
    private readonly RequestDelegate _next;

    public UserProfileAutoProvisionMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, IUserProfileService userProfileService)
    {
        if (context.User.Identity?.IsAuthenticated == true)
        {
            var userId = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!string.IsNullOrEmpty(userId) && !await userProfileService.ExistsAsync(userId))
            {
                var firstName = context.User.FindFirstValue("given_name") ?? "";
                var lastName = context.User.FindFirstValue("family_name") ?? "";

                await userProfileService.CreateAsync(
                    userId,
                    string.IsNullOrEmpty(firstName) ? "New" : firstName,
                    string.IsNullOrEmpty(lastName) ? "User" : lastName,
                    new UserProfileCreateRequestDTO
                    {
                        bio = "",
                        birth_date = DateTime.UtcNow.AddDays(-1)
                    });
            }
        }

        await _next(context);
    }
}
