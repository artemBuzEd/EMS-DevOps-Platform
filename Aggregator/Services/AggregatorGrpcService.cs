using Aggregator.DTOs;
using EventCatalogApi.Protos;
using Google.Protobuf.WellKnownTypes;
using UserProfileApi.Protos;

namespace Aggregator.Services;

public class AggregatorGrpcService
{
    private readonly ILogger<AggregatorGrpcService> _logger;
    private readonly EventCatalog.EventCatalogClient _eventClient;
    private readonly UserProfile.UserProfileClient _userProfileClient;

    public AggregatorGrpcService(ILogger<AggregatorGrpcService> logger, 
        EventCatalog.EventCatalogClient eventClient, 
        UserProfile.UserProfileClient userProfileClient)
    {
        _logger = logger;
        _eventClient = eventClient;
        _userProfileClient = userProfileClient;
    }

    public async Task<EventWithOrganizerDto> GetEventWithOrganizerDetails(string eventId)
    {
        _logger.LogInformation($"GetEventWithOrganizerDetails: {eventId}");
        var eventTask = _eventClient.GetEventAsync(new GetEventRequest { EventId = eventId });
    
        var eventResponse = await eventTask.ResponseAsync;
        
        var userTask = _userProfileClient.GetUserAsync(
            new GetUserRequest { UserId =  eventResponse.OrganizerId}); 
    
        var userResponse = await userTask.ResponseAsync;

        return new EventWithOrganizerDto
        {
            Event = new EventDto
            {
                id = eventResponse.Id,
                title = eventResponse.Title,
                description = eventResponse.Description,
                startDate = eventResponse.StartDate.ToDateTime(),
                endDate = eventResponse.EndDate.ToDateTime(),
                FullLocation = eventResponse.FullLocation,
                organizerId = eventResponse.OrganizerId,
                venueId = string.IsNullOrEmpty(eventResponse.VenueId) ? (int?)null : int.Parse(eventResponse.VenueId),
                capacity = eventResponse.Capacity
            },
            Organizer = new OrganizerDto
            {
                user_id = userResponse.UserId,
                first_name = userResponse.FirstName,
                last_name = userResponse.LastName
            }
        };
    }

    public async Task<Dictionary<string, string>> GetEventTitlesByIdsAsync(IEnumerable<string> eventIds)
    {
        var distinctIds = eventIds.Distinct().ToList();
        if (distinctIds.Count == 0)
            return new Dictionary<string, string>();

        _logger.LogInformation("gRPC GetEventsByIds called for {Count} distinct event IDs", distinctIds.Count);

        var request = new GetEventsByIdsRequest();
        request.EventIds.AddRange(distinctIds);

        var response = await _eventClient.GetEventsByIdsAsync(request);
        return response.Events.ToDictionary(e => e.Id, e => e.Title);
    }
}