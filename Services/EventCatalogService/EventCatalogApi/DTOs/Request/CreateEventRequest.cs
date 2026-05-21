namespace Check.DTOs.Request;

public record CreateEventRequest(
    string Title,
    string Description,
    DateTime StartDate,
    DateTime EndDate,
    string City,
    string Address,
    string Country,
    string CategoryName,
    string CategoryDescription,
    string VenueId,
    int Capacity);