using Domain.Interfaces;
using MediatR;

namespace Application.Events.Queries.GetCategoryNamesQuery;

public class GetCategoryNamesQueryHandler : IRequestHandler<GetCategoryNamesQuery, IEnumerable<string>>
{
    private readonly IEventRepository _eventRepository;

    public GetCategoryNamesQueryHandler(IEventRepository eventRepository)
    {
        _eventRepository = eventRepository;
    }

    public async Task<IEnumerable<string>> Handle(GetCategoryNamesQuery request, CancellationToken cancellationToken)
        => await _eventRepository.GetDistinctCategoryNamesAsync();
}
