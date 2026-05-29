namespace Application.DTOs;

public record EventDto(
    string Id,
    string Title,
    string Description,
    DateTime StartDate,
    DateTime EndDate,
    string FullLocation,
    string CategoryName,
    string OrganizerId,
    string VenueId,
    int Capacity,
    string? PictureUrl
    );