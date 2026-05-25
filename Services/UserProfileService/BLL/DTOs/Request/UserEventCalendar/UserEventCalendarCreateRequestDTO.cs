namespace BLL.DTOs.Request.UserEventCalendar;

public class UserEventCalendarCreateRequestDTO
{
    public string event_id { get; set; }
    public int? registration_id { get; set; } 
    public string status { get; set; }
}