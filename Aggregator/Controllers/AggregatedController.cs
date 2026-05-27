using System.Collections;
using Aggregator.DTOs;
using Aggregator.Services;
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
            var result = await _grpcService.GetEventWithOrganizerDetails(eventId);
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
            var eventTask = GetEventAsync(eventId);
            var commentsTask = GetEventCommentsAsync(eventId);
            
            //this now didnt work due to random seeded calendars in UserProfileService.
            //Also there should be other registration service, so for now there would be empty collenction
            var registrationTask = GetRegisteredUsersCountAsync(eventId);
            await Task.WhenAll(eventTask, commentsTask, registrationTask);

            var eventData = await eventTask;
            if (eventData == null)
            {
                return NotFound($"Event {eventId} not found");
            }

            VenueDto? venue = null;
            if (eventData.venueId.HasValue)
            {
                venue = await GetVenueAsync(eventData.venueId.Value);
            }

            var response = new EventDetailsResponse
            {
                Event = eventData,
                Venue = venue,
                Comments = await commentsTask,
                RegisteredUsersCount = await registrationTask,
            };

            return Ok(response);
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "Error calling downstream services for event {EventId} [{Message}]", eventId,
                ex.Message);
            return StatusCode(503, "Service temporarily unavailable");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling downstream services for event {EventId} [{Message}]", eventId, ex.Message);
            return StatusCode(500, "Server error occured");
        }
    }

    private async Task<EventDto?> GetEventAsync(string eventId)
    {
        var client = _httpClientFactory.CreateClient("EventCatalogService");
        var response = await client.GetAsync($"/api/events/{eventId}");


        if (!response.IsSuccessStatusCode)
        {
            return null;
        }

        return await response.Content.ReadFromJsonAsync<EventDto>();
    }

    private async Task<VenueDto?> GetEventVenueAsync(string eventId)
    {
        var client = _httpClientFactory.CreateClient("VenueService");
        var eventClient = _httpClientFactory.CreateClient("EventCatalogService");
        var eventResponse = await eventClient.GetAsync($"/api/events/{eventId}");
        var eventData = await eventResponse.Content.ReadFromJsonAsync<EventDto>();
        
        var response = await client.GetAsync($"/api/venues/{eventData?.venueId}");
        return await response.Content.ReadFromJsonAsync<VenueDto>();
    }

    private async Task<VenueDto?> GetVenueAsync(int venueId)
    {
        var client = _httpClientFactory.CreateClient("VenueService");
        var response = await client.GetAsync($"/api/venue/GetVenuesById/{venueId}");
        return await response.Content.ReadFromJsonAsync<VenueDto>();
    }

    private async Task<IEnumerable<CommentDto>> GetEventCommentsAsync(string eventId)
    {
        try
        {
            var client = _httpClientFactory.CreateClient("UserProfileService");
            var response = await client.GetAsync($"/api/users/UserComment/ByEventId/{eventId}");

            if (!response.IsSuccessStatusCode)
            {
                return Enumerable.Empty<CommentDto>();
            }

            return await response.Content.ReadFromJsonAsync<IEnumerable<CommentDto>>() ??
                   Enumerable.Empty<CommentDto>();
        }
        catch(Exception ex)
        {
            _logger.LogError(ex, "ERROR IN AGGREGATED CONTROLLER " + ex.Message);
            return Enumerable.Empty<CommentDto>();
        }
    }
    
    private async Task<int> GetRegisteredUsersCountAsync(string eventId)
    {
        try
        {
            var client = _httpClientFactory.CreateClient("UserProfileService");
            var response = await client.GetAsync($"/api/users/UserEventCalendar/RegisteredByEventId/{eventId}");
            
            if (!response.IsSuccessStatusCode)
            {
                return 0;
            }

            var registrations = await response.Content.ReadFromJsonAsync<IEnumerable<object>>();
            return registrations?.Count() ?? 0;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching registrations for event {EventId} [{Message}] ", eventId,ex.Message);
            return 0;
        }
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