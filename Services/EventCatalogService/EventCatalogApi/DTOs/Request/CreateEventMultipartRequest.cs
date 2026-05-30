using Microsoft.AspNetCore.Http;

namespace Check.DTOs.Request;

public class CreateEventMultipartRequest
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public string City { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public string CategoryName { get; set; } = string.Empty;
    public string CategoryDescription { get; set; } = string.Empty;
    public string VenueId { get; set; } = string.Empty;
    public int Capacity { get; set; }
    public IFormFile? Image { get; set; }
}
