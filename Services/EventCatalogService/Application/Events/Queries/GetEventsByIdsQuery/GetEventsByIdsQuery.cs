using Application.Common.Interfaces;
using Application.DTOs;

namespace Application.Events.Queries.GetEventsByIdsQuery;

public record GetEventsByIdsQuery(IEnumerable<string> Ids) : IQuery<IEnumerable<EventDto>>;
