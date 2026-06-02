namespace Aggregator.DTOs;

public class UserCalendarDto
{
    public int CalendarId { get; set; }
    public string UserId { get; set; }
    public string EventId { get; set; }
    public string EventTitle { get; set; }
    public DateTime AddedAt { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string Status { get; set; }
}