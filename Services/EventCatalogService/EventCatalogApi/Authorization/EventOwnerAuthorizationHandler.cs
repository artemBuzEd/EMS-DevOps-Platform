using System.Security.Claims;
using Domain.Interfaces;
using Microsoft.AspNetCore.Authorization;

namespace Check.Authorization;

public class EventOwnerAuthorizationHandler : AuthorizationHandler<EventOwnerRequirement>
{
    private readonly IEventRepository _eventRepository;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public EventOwnerAuthorizationHandler(
        IEventRepository eventRepository,
        IHttpContextAccessor httpContextAccessor)
    {
        _eventRepository = eventRepository;
        _httpContextAccessor = httpContextAccessor;
    }

    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        EventOwnerRequirement requirement)
    {
        var userId = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
            return;

        if (context.User.IsInRole("admin"))
        {
            context.Succeed(requirement);
            return;
        }

        var httpContext = _httpContextAccessor.HttpContext;
        var eventId = httpContext?.Request.RouteValues["id"]?.ToString();
        if (string.IsNullOrEmpty(eventId))
            return;

        var @event = await _eventRepository.GetByIdAsync(eventId);
        if (@event == null)
            return;

        if (@event.OrganizerId == userId)
        {
            context.Succeed(requirement);
        }
    }
}
