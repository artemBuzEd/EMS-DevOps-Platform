using Application.DTOs;
using Domain.Interfaces;
using Mapster;
using MediatR;

namespace Application.Events.Queries.GetEventsByIdsQuery;

public class GetEventsByIdsQueryHandler : IRequestHandler<GetEventsByIdsQuery, IEnumerable<EventDto>>
{
    private readonly IEventRepository _eventRepository;

    public GetEventsByIdsQueryHandler(IEventRepository eventRepository)
    {
        _eventRepository = eventRepository;
    }

    public async Task<IEnumerable<EventDto>> Handle(GetEventsByIdsQuery request, CancellationToken cancellationToken)
    {
        var ids = request.Ids?.ToList() ?? new List<string>();
        if (ids.Count == 0)
            return Enumerable.Empty<EventDto>();

        var events = await _eventRepository.GetByIdsAsync(ids);
        return events.Adapt<IEnumerable<EventDto>>();
    }
}
