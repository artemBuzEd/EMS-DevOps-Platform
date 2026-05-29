using Aggregator.DTOs;
using Aggregator.Services;
using Grpc.Core;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Aggregator.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AggregatedController : ControllerBase
{
    private readonly ILogger<AggregatedController> _logger;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly AggregatorGrpcService _grpcService;

    public AggregatedController(ILogger<AggregatedController> logger, IHttpClientFactory httpClientFactory, AggregatorGrpcService grpcService)
    {
        _logger = logger;
        _httpClientFactory = httpClientFactory;
        _grpcService = grpcService;
    }
    
    [AllowAnonymous]
    [HttpGet("event-details-with-organizer/{eventId}")]
    [ProducesResponseType(typeof(EventWithOrganizerDto),StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetEventWithOrganizerInfo(string eventId)
    {
        try
        {
            var result
                = await _grpcService.GetEventWithOrganizerDetails(eventId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error calling downstream services (User, Event) for event {eventId} [{ex.Message}]");
            return StatusCode(500, $"Internal server error {ex.Message}");
        }
    }
    [AllowAnonymous]
    [HttpGet("event-details/{eventId}")]
    [ProducesResponseType(typeof(EventDetailsResponse),StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetAllEventDetails(string eventId)
    {
        try
        {
            var result = await _grpcService.GetEventDetailsAsync(eventId);

            if (result.Event.venueId.HasValue)
            {
                result.Venue = await GetVenueAsync(result.Event.venueId.Value);
            }

            return Ok(result);
        }
        catch (RpcException ex) when (ex.StatusCode == Grpc.Core.StatusCode.NotFound)
        {
            return NotFound($"Event {eventId} not found");
        }
        catch (RpcException ex)
        {
            _logger.LogError(ex, "gRPC error for event {EventId} [{Message}]", eventId, ex.Message);
            return StatusCode(503, "Service temporarily unavailable");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching event details for {EventId} [{Message}]", eventId, ex.Message);
            return StatusCode(500, "Internal server error");
        }
    }

    private async Task<VenueDto?> GetVenueAsync(int venueId)
    {
        var client = _httpClientFactory.CreateClient("VenueService");
        var response = await client.GetAsync($"/api/venue/GetVenuesById/{venueId}");
        return await response.Content.ReadFromJsonAsync<VenueDto>();
    }

    [Authorize]
    [HttpGet("user-dashboard/{userId}")]
    [ProducesResponseType(typeof(UserDashboardResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetUserDashboardAsync(string userId)
    {
        try
        {
            var userTask = GetUserProfileAsync(userId);
            var calendarTask = GetUserEventCalendarsAsync(userId);
            var commentsTask = GetUserCommentsAsync(userId);

            await Task.WhenAll(userTask, calendarTask, commentsTask);

            var user = await userTask;
            if (user == null)
            {
                return NotFound($"User {userId} not found");
            }

            var calendars = await calendarTask;
            var comments = await commentsTask;

            var eventTitles = new Dictionary<string, string>();
            try
            {
                var eventIds = comments.Select(c => c.event_id).Distinct();
                eventTitles = await _grpcService.GetEventTitlesByIdsAsync(eventIds);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching event titles for user {UserId} [{Message}]", userId, ex.Message);
            }

            var enrichedComments = comments.Select(comment => new UserCommentDto
            {
                CommentId = comment.id,
                EventId = comment.event_id,
                EventTitle = eventTitles.TryGetValue(comment.event_id, out var title) ? title : "Unknown Event",
                CommentText = comment.comment,
                CreatedAt = comment.added_at,
                IsChanged = comment.is_changed
            });

            var response = new UserDashboardResponse
            {
                User = user,
                MyCalendars = calendars,
                MyComments = enrichedComments
            };
            
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error aggregating user dashboard for {UserId} [{Message}]", userId, ex.Message);
            return StatusCode(500, "Internal server error");
        }
    }
    private async Task<UserProfileDto?> GetUserProfileAsync(string userId)
    {
        var client = _httpClientFactory.CreateClient("UserProfileService");
        var response = await client.GetAsync($"/api/users/UserProfile/{userId}/");

        if (!response.IsSuccessStatusCode)
        {
            return null;
        }
        
        return await response.Content.ReadFromJsonAsync<UserProfileDto>();
    }

    private async Task<IEnumerable<CalendarDto>> GetUserEventCalendarsAsync(string userId)
    {
        try
        {
            var client = _httpClientFactory.CreateClient("UserProfileService");
            var response = await client.GetAsync($"/api/users/UserEventCalendar/ByUserId/{userId}");

            if (!response.IsSuccessStatusCode)
            {
                return Enumerable.Empty<CalendarDto>();
            }

            return await response.Content.ReadFromJsonAsync<IEnumerable<CalendarDto>>() ??
                   Enumerable.Empty<CalendarDto>();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching calendars for user {UserId} [{Message}]", userId, ex.Message);
            return Enumerable.Empty<CalendarDto>();
        }
    }

    private async Task<IEnumerable<CommentDto>> GetUserCommentsAsync(string userId)
    {
        try
        {
            var client = _httpClientFactory.CreateClient("UserProfileService");
            var response = await client.GetAsync($"/api/users/UserComment/ByUserId/{userId}");

            if (!response.IsSuccessStatusCode)
            {
                return Enumerable.Empty<CommentDto>();
            }

            return await response.Content.ReadFromJsonAsync<IEnumerable<CommentDto>>() ??
                   Enumerable.Empty<CommentDto>();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching comments for user {UserId} [{Message}]", userId, ex.Message);
            return Enumerable.Empty<CommentDto>();
        }
    }
}