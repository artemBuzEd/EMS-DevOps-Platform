namespace BLL.DTOs.Request.UserComment;

public class UserCommentCreateRequestDTO
{
    public string event_id { get; set; }
    public string comment { get; set; }
    public int rating { get; set; }
}