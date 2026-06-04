using System.Collections.Concurrent;
using System.Reflection;
using Domain.Entities;
using Domain.Helpers;
using Domain.Interfaces;
using MongoDB.Bson;

namespace EventCatalogApi.IntegrationTests.Infrastructure;

public class InMemoryEventRepository : IEventRepository
{
    private readonly ConcurrentDictionary<string, Event> _store = new();

    public void Reset() => _store.Clear();

    public Task<IQueryable<Event>> GetAllAsync() => Task.FromResult(_store.Values.AsQueryable());

    public Task<Event?> GetByIdAsync(string id)
    {
        _store.TryGetValue(id, out var ev);
        return Task.FromResult(ev);
    }

    public Task AddAsync(Event @event)
    {
        if (string.IsNullOrEmpty(@event.Id))
        {
            var idProp = typeof(Domain.BaseEntity).GetProperty("Id", BindingFlags.Instance | BindingFlags.Public)!;
            idProp.SetValue(@event, ObjectId.GenerateNewId().ToString());
        }
        _store[@event.Id] = @event;
        return Task.CompletedTask;
    }

    public Task UpdateAsync(Event @event)
    {
        _store[@event.Id] = @event;
        return Task.CompletedTask;
    }

    public Task DeleteAsync(string id)
    {
        _store.TryRemove(id, out _);
        return Task.CompletedTask;
    }

    public Task<IQueryable<Event>> SearchByTitleAsync(string title) =>
        Task.FromResult(_store.Values.Where(e => e.Title.Contains(title)).AsQueryable());

    public Task<IQueryable<Event>> SearchByTextAsync(string searchText) =>
        Task.FromResult(_store.Values.AsQueryable());

    public Task<PagedResult<Event>> GetUpComingEventsByCategoryAsync(string categoryName, int page, int pageSize) =>
        Task.FromResult(new PagedResult<Event>(new List<Event>(), 0, page, pageSize));

    public Task<IEnumerable<Event>> GetEventsByDateAsync(DateTime startDate, DateTime endDate) =>
        Task.FromResult<IEnumerable<Event>>(_store.Values);

    public Task<PagedResult<Event>> GetPagedEventsAsync(int page, int pageSize, string? categoryName) =>
        Task.FromResult(new PagedResult<Event>(_store.Values.ToList(), _store.Count, page, pageSize));

    public Task<IEnumerable<Event>> GetByIdsAsync(IEnumerable<string> ids) =>
        Task.FromResult<IEnumerable<Event>>(_store.Values.Where(e => ids.Contains(e.Id)));

    public Task<IEnumerable<string>> GetDistinctCategoryNamesAsync() =>
        Task.FromResult<IEnumerable<string>>(
            _store.Values
                .Select(e => e.Category.Name)
                .Distinct()
                .OrderBy(n => n)
                .ToList());
}
