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
using Common.FileStorage;
using Domain.Helpers;
using Domain.Interfaces;
using Domain.ValueObjects;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Check.Controllers;
public class EventsController : BaseApiController
{
    private readonly IEventRepository _eventRepository;
    private readonly IFileStorage _fileStorage;

    public EventsController(IMediator mediator, IEventRepository eventRepository, IFileStorage fileStorage) : base(mediator)
    {
        _eventRepository = eventRepository;
        _fileStorage = fileStorage;
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

    [Authorize(Policy = "CanCreateEvent")]
    [HttpPost("{id}/picture")]
    public async Task<IActionResult> UploadPicture(string id, IFormFile file, CancellationToken cancellationToken = default)
    {
        var eventEntity = await _eventRepository.GetByIdAsync(id);
        if (eventEntity is null)
            return NotFound(new { message = $"Event with id {id} not found" });

        await using var stream = file.OpenReadStream();
        var result = ImageValidator.Validate(stream, file.ContentType, file.Length);

        switch (result)
        {
            case ImageValidationResult.TooLarge:
                return StatusCode(StatusCodes.Status413PayloadTooLarge,
                    new { message = "File size exceeds 5 MB limit." });
            case ImageValidationResult.UnsupportedType:
            case ImageValidationResult.InvalidMagicBytes:
                return StatusCode(StatusCodes.Status415UnsupportedMediaType,
                    new { message = "Only JPEG, PNG, and WebP images are allowed." });
        }

        stream.Position = 0;
        var ext = ImageValidator.GetExtension(file.ContentType);
        var fileName = $"events/{id}-{Guid.NewGuid()}{ext}";

        if (!string.IsNullOrEmpty(eventEntity.PictureUrl))
        {
            var oldKey = ExtractKeyFromUrl(eventEntity.PictureUrl);
            if (oldKey != null)
                await _fileStorage.DeleteAsync(oldKey, cancellationToken);
        }

        var key = await _fileStorage.SaveAsync(stream, fileName, file.ContentType, cancellationToken);
        var imageUrl = _fileStorage.GetPublicUrl(key);
        eventEntity.SetPictureUrl(imageUrl);
        await _eventRepository.UpdateAsync(eventEntity);

        return Ok(new { imageUrl });
    }

    [AllowAnonymous]
    [HttpGet("{id}/picture")]
    public async Task<IActionResult> GetPicture(string id)
    {
        var eventEntity = await _eventRepository.GetByIdAsync(id);
        if (eventEntity is null)
            return NotFound(new { message = $"Event with id {id} not found" });

        if (string.IsNullOrEmpty(eventEntity.PictureUrl))
            return NotFound(new { message = "No picture set for this event." });

        return Ok(new { imageUrl = eventEntity.PictureUrl });
    }

    [Authorize(Policy = "EventOwner")]
    [HttpDelete("{id}/picture")]
    public async Task<IActionResult> DeletePicture(string id, CancellationToken cancellationToken = default)
    {
        var eventEntity = await _eventRepository.GetByIdAsync(id);
        if (eventEntity is null)
            return NotFound(new { message = $"Event with id {id} not found" });

        if (!string.IsNullOrEmpty(eventEntity.PictureUrl))
        {
            var oldKey = ExtractKeyFromUrl(eventEntity.PictureUrl);
            if (oldKey != null)
                await _fileStorage.DeleteAsync(oldKey, cancellationToken);
            eventEntity.SetPictureUrl(null);
            await _eventRepository.UpdateAsync(eventEntity);
        }

        return NoContent();
    }

    private static string? ExtractKeyFromUrl(string url)
    {
        var uploadsIndex = url.IndexOf("/uploads/", StringComparison.OrdinalIgnoreCase);
        if (uploadsIndex < 0) return null;
        return url[(uploadsIndex + "/uploads/".Length)..];
    }
}
