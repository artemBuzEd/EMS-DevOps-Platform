namespace Application.DTOs;

public record EventMiniDto(
    string Title,
    DateTime StartDate,
    DateTime EndDate,
    string FullLocation,
    string? PictureUrl
    );