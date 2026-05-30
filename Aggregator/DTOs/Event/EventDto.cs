namespace Aggregator.DTOs;

public class EventDto
{
    public string id { get; set; }
    public string title { get; set; }
    public string description { get; set; }
    public DateTime startDate { get; set; }
    public DateTime endDate { get; set; }
    public string FullLocation { get; set; }
    public string organizerId { get; set; }
    public int? venueId { get; set; }
    public int capacity { get; set; }
    public string pictureUrl { get; set; }
}