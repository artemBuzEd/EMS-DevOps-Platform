using System.Security.Claims;
using Application.DTOs;
using Application.Events.Commands.CreateEvent;
using Application.Events.Commands.DeleteEvent;
using Application.Events.Commands.UpdateEvent;
using Application.Events.Queries.GetAllEventsByDateRangeQuery;
using Application.Events.Queries.GetAllEventsQuery;
using Application.Events.Queries.GetEventByIdQuery;
using Application.Events.Queries.GetEventByText;
using Application.Events.Queries.GetEventsByTitleQuery;
using Application.Events.Queries.GetUpComingEventsQuery;
using Check.DTOs.Request;
using Check.Request;
using Domain.Helpers;
using Domain.ValueObjects;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Check.Controllers;
//Todo make the get method to get full event with VENUE for the aggregator controller
public class EventsController : BaseApiController
{
    public EventsController(IMediator mediator) : base(mediator)
    {
    }

    [AllowAnonymous]
    [HttpGet]
    public async Task<IActionResult> GetAllEventsAsync(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? categoryNameFilter = null,
        CancellationToken cancellationToken = default
    )
    {
        var query = new GetAllEventsQuery(pageNumber, pageSize, categoryNameFilter);
        return await HandleRequest<GetAllEventsQuery, PagedResult<EventMiniDto>>(query, cancellationToken);
    }

    [AllowAnonymous]
    [HttpGet("upcoming")]
    public async Task<IActionResult> GetUpcomingEvents(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? categoryNameFilter = null,
        CancellationToken cancellationToken = default
    )
    {
        var query = new GetUpcomingEventsQuery(pageNumber, pageSize, categoryNameFilter);
        return await HandleRequest<GetUpcomingEventsQuery, PagedResult<EventDto>>(query, cancellationToken);
    }

    [AllowAnonymous]
    [HttpGet("{id}"), ActionName("GetById")]
    public async Task<IActionResult> GetByEventId(string id)
    {
        var query = new GetEventByIdQuery(id);
        return await HandleRequest<GetEventByIdQuery, EventDto>(query);
    }

    [AllowAnonymous]
    [HttpGet("title/{title}")]
    public async Task<IActionResult> GetAllEventsByTitle(string title)
    {
        var query = new GetEventsByTitleQuery(title);
        return await HandleRequest<GetEventsByTitleQuery, IEnumerable<EventMiniDto>>(query);
    }

    [AllowAnonymous]
    [HttpGet("dateRange/{startDate}/{endDate}")]
    public async Task<IActionResult> GetAllEventsByDateRange(DateTime startDate, DateTime endDate)
    {
        DateRangeRequest dateRangeRequest = new DateRangeRequest(startDate, endDate);
        var query = new GetAllEventsByDateRangeQuery(dateRangeRequest.StartDate, dateRangeRequest.EndDate);
        return await HandleRequest<GetAllEventsByDateRangeQuery, IEnumerable<EventDto>>(query);
    }

    [AllowAnonymous]
    [HttpGet("searchText/{text}")]
    public async Task<IActionResult> GetAllEventsBySearchText(string text)
    {
        var query = new GetEventsByTextQuery(text);
        return await HandleRequest<GetEventsByTextQuery, IEnumerable<EventMiniDto>>(query);
    }

    [Authorize(Policy = "CanCreateEvent")]
    [HttpPost]
    public async Task<IActionResult> CreateEvent(
        [FromBody] CreateEventRequest request,
        CancellationToken cancellationToken = default
    )
    {
        var organizerId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;

        var command = new CreateEventCommand(
            request.Title,
            request.Description,
            new EventDateRange(request.StartDate, request.EndDate),
            new Location(request.Address, request.City, request.Country),
            request.CategoryName,
            request.CategoryDescription,
            organizerId,
            request.VenueId,
            request.Capacity
        );

        return await HandleCommand(command, cancellationToken);
    }

    [Authorize(Policy = "EventOwner")]
    [HttpPut("fullUpdate/{id}")]
    public async Task<IActionResult> UpdateFullEvent(
        string id,
        [FromBody] UpdateEventRequest request,
        CancellationToken cancellationToken = default
    )
    {
        var command = new UpdateEventCommand(
            id,
            request.Title,
            request.Description,
            new Location(request.Address, request.City, request.Country),
            new EventDateRange(request.StartDate, request.EndDate),
            request.Capacity
        );

        return await HandleCommand(command, cancellationToken);
    }

    [Authorize(Policy = "EventOwner")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteEvent(string id, CancellationToken cancellationToken = default)
    {
        var command = new DeleteEventCommand(id);
        return await HandleDeleteCommand<DeleteEventCommand>(command, cancellationToken);
    }
}
