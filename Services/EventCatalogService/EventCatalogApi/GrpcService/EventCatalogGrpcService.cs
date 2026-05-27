using Application.Events.Commands.CreateEvent;
using Application.Events.Queries.GetAllEventsQuery;
using Application.Events.Queries.GetEventByIdQuery;
using Application.Events.Queries.GetEventsByIdsQuery;
using Domain.ValueObjects;
using EventCatalogApi.Protos;
using Google.Protobuf.WellKnownTypes;
using Grpc.Core;
using MediatR;

namespace Check.GrpcService;

public class EventCatalogGrpcService : EventCatalog.EventCatalogBase
{
    private readonly ILogger<EventCatalogGrpcService> _logger;
    private readonly IMediator _mediator;

    public EventCatalogGrpcService(ILogger<EventCatalogGrpcService> logger, IMediator mediator)
    {
        _logger = logger;
        _mediator = mediator;
    }

    public override async Task<EventFullResponse> GetEvent(GetEventRequest request, ServerCallContext context)
    {
        _logger.LogInformation("gRPC GetEvent called for ID: {EventId}", request.EventId);
        var query = new GetEventByIdQuery(request.EventId);
        var eventDto = await _mediator.Send(query);

        if (eventDto is null)
            throw new RpcException(new Status(StatusCode.NotFound, $"Event not found with id {request.EventId}"));

        return new EventFullResponse
        {
            Id = eventDto.Id,
            Title = eventDto.Title,
            Description = eventDto.Description,
            StartDate = Timestamp.FromDateTime(eventDto.StartDate),
            EndDate = Timestamp.FromDateTime(eventDto.EndDate),
            FullLocation = eventDto.FullLocation,
            CategoryName = eventDto.CategoryName,
            OrganizerId = eventDto.OrganizerId,
            VenueId = eventDto.VenueId,
            Capacity = eventDto.Capacity
        };
    }

    public override async Task<EventListResponse> GetAllEvents(GetAllEventsRequest request, ServerCallContext context)
    {
        _logger.LogInformation("gRPC GetAllEvents called");
        var query = new GetAllEventsQuery(request.PageNumber, request.PageSize, request.CategoryName);
        var events = await _mediator.Send(query);

        var response = new EventListResponse
        {
            Page = events.Page,
            TotalCount = events.TotalCount,
            PageSize = events.PageSize
        };

        response.Events.AddRange(events.Items.Select(e => new EventMiniResponse
        {
            Title = e.Title,
            FullLocation = e.FullLocation,
            StartDate = Timestamp.FromDateTime(e.StartDate),
            EndDate = Timestamp.FromDateTime(e.EndDate),
        }));

        return response;
    }

    public override async Task<CreatedEventResponse> CreateEvent(CreateEventRequest request, ServerCallContext context)
    {
        _logger.LogInformation("gRPC CreateEvent called");

        var command = new CreateEventCommand
        (
            request.Title,
            request.Description,
            new EventDateRange(request.StartDate.ToDateTime(), request.EndDate.ToDateTime()),
            new Location(request.Address, request.City, request.Country),
            request.CategoryName,
            request.CategoryDescription,
            request.OrganizerId,
            request.VenueId,
            request.Capacity
        );
        
        var result = await _mediator.Send(command);

        return new CreatedEventResponse
        {
            Id = result
        };
    }

    public override async Task<GetEventsByIdsResponse> GetEventsByIds(GetEventsByIdsRequest request, ServerCallContext context)
    {
        var ids = request.EventIds.ToList();
        _logger.LogInformation("gRPC GetEventsByIds called for {Count} IDs", ids.Count);

        var query = new GetEventsByIdsQuery(ids);
        var events = await _mediator.Send(query);

        var response = new GetEventsByIdsResponse();
        response.Events.AddRange(events.Select(e => new EventTitleResponse
        {
            Id = e.Id,
            Title = e.Title
        }));

        return response;
    }
}