namespace Application.DTOs;

public record EventMiniDto(
    string Id,
    string Title,
    string Description,
    DateTime StartDate,
    DateTime EndDate,
    string FullLocation,
    string CategoryName,
    int Capacity,
    string? PictureUrl
    );
