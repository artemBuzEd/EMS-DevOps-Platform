namespace Aggregator.DTOs;

public class UserDashboardResponse
{
    public UserProfileDto User { get; set; }
    public IEnumerable<UserCommentDto> MyComments { get; set; } = new List<UserCommentDto>();
    public IEnumerable<CalendarDto> MyCalendars { get; set; }
}
