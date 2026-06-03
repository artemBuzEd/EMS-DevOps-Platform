using System.Linq.Expressions;
using Domain.Entities;
using Domain.Helpers;
using Domain.Interfaces;
using Infrastructure.Common;
using Infrastructure.DbContext;
using MongoDB.Bson;
using MongoDB.Driver;

namespace Infrastructure.Repositories;

public class EventRepository : IEventRepository
{
    private readonly MongoDbContext _context;
    private readonly IUnitOfWork _unitOfWork;

    public EventRepository(MongoDbContext context, IUnitOfWork unitOfWork)
    {
        _context = context;
        _unitOfWork = unitOfWork;
    }

    public async Task<IQueryable<Event>> GetAllAsync()
    {
        var events = await _context.Events.Find(_ => true).ToListAsync();

        return events.AsQueryable();
    }

    public async Task<Event?> GetByIdAsync(string id)
    {
        return await _context.Events.Find(e => e.Id == id).FirstOrDefaultAsync();
    }

    public async Task AddAsync(Event @event)
    {
        if(_unitOfWork.Session.IsInTransaction)
            await _context.Events.InsertOneAsync(_unitOfWork.Session, @event);
        else
            await _context.Events.InsertOneAsync( @event);
    }

    public async Task UpdateAsync(Event @event)
    {
        var filter = Builders<Event>.Filter.Eq(e => e.Id, @event.Id);
        
        if(_unitOfWork.Session.IsInTransaction)
            await _context.Events.ReplaceOneAsync(_unitOfWork.Session ,filter, @event);
        else
            await _context.Events.ReplaceOneAsync(filter, @event);
    }

    public async Task DeleteAsync(string id)
    {
        var filter = Builders<Event>.Filter.Eq(e => e.Id, id);
        
        if(_unitOfWork.Session.IsInTransaction)
            await _context.Events.DeleteOneAsync(_unitOfWork.Session,filter);
        else
            await _context.Events.DeleteOneAsync(filter);
    }

    public async Task<IQueryable<Event>> SearchByTitleAsync(string title)
    {
        var filter = Builders<Event>.Filter.Regex(e => e.Title, 
            new MongoDB.Bson.BsonRegularExpression(title, "i"));
        
        var events = await _context.Events.Find(filter).ToListAsync();
        return events.AsQueryable();
    }

    public async Task<IQueryable<Event>> SearchByTextAsync(string searchText)
    {
        var filter = Builders<Event>.Filter.Or(
            Builders<Event>.Filter.Regex(e => e.Title, 
                new MongoDB.Bson.BsonRegularExpression(searchText, "i")),
            Builders<Event>.Filter.Regex(e => e.Description, 
                new MongoDB.Bson.BsonRegularExpression(searchText, "i"))
        );
        
        var events = await _context.Events.Find(filter).ToListAsync();
        return events.AsQueryable();
    }
    
    public async Task<PagedResult<Event>> GetPagedEventsAsync(int page, int pageSize, string? categoryName)
    {
        var filterBuilder = Builders<Event>.Filter;
        var filter = filterBuilder.Empty;
        
        if (!string.IsNullOrEmpty(categoryName))
        {
            filter &= filterBuilder.Regex(e => e.Category.Name, new BsonRegularExpression(categoryName, "i"));
        }

        var totalCount = await _context.Events.CountDocumentsAsync(filter);
    
        var events = await _context.Events
            .Find(filter)
            .Sort(Builders<Event>.Sort.Ascending("dateRange.start"))
            .Skip((page - 1) * pageSize)
            .Limit(pageSize)
            .ToListAsync();
        
        return new PagedResult<Event>(events, (int)totalCount, page, pageSize);
    }

    public async Task<PagedResult<Event>> GetUpComingEventsByCategoryAsync(string categoryName, int page, int pageSize)
    {
        var now = DateTime.UtcNow;
        
        var filter = Builders<Event>.Filter.Gte("dateRange.start", now);

        if (!string.IsNullOrWhiteSpace(categoryName))
        {


            filter = Builders<Event>.Filter.And(
                filter,
                Builders<Event>.Filter.Regex(e => e.Category.Name, 
                    new MongoDB.Bson.BsonRegularExpression(categoryName, "i"))
            );
        }

        var totalCount = await _context.Events.CountDocumentsAsync(filter: filter);
        
        var events = await _context.Events
            .Find(filter)
            .Sort(Builders<Event>.Sort.Ascending("dateRange.start"))
            .Skip((page - 1) * pageSize)
            .Limit(pageSize)
            .ToListAsync();
        
        return new PagedResult<Event>(events, (int)totalCount, page, pageSize);
    }

    public async Task<IEnumerable<Event>> GetByIdsAsync(IEnumerable<string> ids)
    {
        var idList = ids.ToList();
        if (idList.Count == 0)
            return Enumerable.Empty<Event>();

        var filter = Builders<Event>.Filter.In(e => e.Id, idList);
        return await _context.Events.Find(filter).ToListAsync();
    }

    public async Task<IEnumerable<Event>> GetEventsByDateAsync(DateTime startDate, DateTime endDate)
    {
        var pipeline = new[]
        {
            new BsonDocument("$match", new BsonDocument
            {
                {"$or", new BsonArray
                {
                    new BsonDocument
                    {
                        { "$and", new BsonArray
                        {
                            new BsonDocument("dateRange.start", new BsonDocument("$gte", startDate)),
                            new BsonDocument("dateRange.start", new BsonDocument("$lte", endDate))
                        }}
                    },
                    new BsonDocument
                    {
                        { "$and", new BsonArray
                        {
                            new BsonDocument("dateRange.end", new BsonDocument("$gte", startDate)),
                            new BsonDocument("dateRange.end", new BsonDocument("$lte", endDate))
                        }}
                    }
                }}
            })
        };
        return await _context.Events.Aggregate<Event>(pipeline).ToListAsync();
    }
}