using System.Linq.Expressions;
using Domain.Entities;
using Domain.Helpers;

namespace Domain.Interfaces;

public interface IEventRepository
{
    Task<IQueryable<Event>> GetAllAsync();
    Task<Event?> GetByIdAsync(string id);
    Task AddAsync(Event @event);
    Task UpdateAsync(Event @event);
    Task DeleteAsync(string id);
    Task<IQueryable<Event>> SearchByTitleAsync(string title);
    Task<IQueryable<Event>> SearchByTextAsync(string searchText);
    Task<PagedResult<Event>> GetUpComingEventsByCategoryAsync(string categoryName, int page, int pageSize);
    Task<IEnumerable<Event>> GetEventsByDateAsync(DateTime startDate, DateTime endDate);
    Task<PagedResult<Event>> GetPagedEventsAsync(int page, int pageSize, string? categoryName);
    Task<IEnumerable<Event>> GetByIdsAsync(IEnumerable<string> ids);
    Task<IEnumerable<string>> GetDistinctCategoryNamesAsync();
}