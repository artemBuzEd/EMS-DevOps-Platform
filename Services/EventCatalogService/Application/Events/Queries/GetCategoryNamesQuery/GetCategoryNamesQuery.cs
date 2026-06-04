using Application.Caching;
using Application.Common.Interfaces;

namespace Application.Events.Queries.GetCategoryNamesQuery;

public record GetCategoryNamesQuery : IQuery<IEnumerable<string>>, ICacheable
{
    public string CacheKey => "GetCategoryNames";
    public TimeSpan? CacheDuration => TimeSpan.FromMinutes(10);
}
