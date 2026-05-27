using Domain.Exceptions;
using Domain.ValueObjects;
using MongoDB.Bson.Serialization.Attributes;

namespace Domain.Entities;

public class Event : BaseEntity
{
    [BsonElement("title")] 
    public string Title { get; private set; }

    [BsonElement("description")] 
    public string Description { get; private set; }

    [BsonElement("dateRange")] 
    public EventDateRange DateRange { get; private set; }

    [BsonElement("location")] 
    public Location Location { get; private set; }

    [BsonElement("category")] 
    public EventCategory Category { get; private set; }

    [BsonElement("organizerId")] 
    public string OrganizerId { get; private set; }

    [BsonElement("venueId")] 
    public string VenueId { get; private set; }

    [BsonElement("capacity")]
    public int Capacity { get; private set; }

    [BsonElement("pictureUrl")]
    public string? PictureUrl { get; private set; }

    private Event() : base()
    {
    }

    public Event(string title, string description, EventDateRange dateRange, Location location, EventCategory category,
        string organizerId, string venueId, int capacity)
    {
        if (string.IsNullOrWhiteSpace(title))
            throw new DomainException("Event title is required.");
        if (capacity <= 0)
            throw new DomainException("Capacity must be a positive number.");

        Title = title;
        Description = description;
        DateRange = dateRange;
        Location = location;
        Category = category;
        OrganizerId = organizerId;
        VenueId = venueId;
        Capacity = capacity;
        CreatedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    public void ChangeCapacity(int newCapacity)
    {
        if (newCapacity <= 0)
        {
            throw new DomainException("Capacity must be a positive number.");
        }

        Capacity = newCapacity;
        UpdatedAt = DateTime.UtcNow;
    }

    public void UpdateTitle(string title)
    {
        if (string.IsNullOrWhiteSpace(title))
            throw new DomainException("Event title is required. Cant be null or empty.");
        Title = title;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Reschedule(DateTime newStart, DateTime newEnd)
    {
        DateRange = new EventDateRange(newStart, newEnd);
        UpdatedAt = DateTime.UtcNow;
    }

    public void ChangeLocation(Location newLocation)
    {
        Location = newLocation ?? throw new DomainException("Location cannot be null.");
        UpdatedAt = DateTime.UtcNow;
    }

    public void UpdateDescription(string newDescription)
    {
        Description = newDescription;
        UpdatedAt = DateTime.UtcNow;
    }

    public void SetPictureUrl(string? url)
    {
        PictureUrl = url;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Update(string newTitle, string newDescription, DateTime newStart, DateTime newEnd, int newCapacity,
        Location newLocation)
    {
        UpdateTitle(newTitle);
        Reschedule(newStart, newEnd);
        ChangeCapacity(newCapacity);
        ChangeLocation(newLocation);
        UpdateDescription(newDescription);
    }
}