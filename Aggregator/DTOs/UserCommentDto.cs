namespace Aggregator.DTOs;

public class UserCommentDto
{
    public int CommentId { get; set; }
    public string EventId { get; set; }
    public string EventTitle { get; set; }
    public string CommentText { get; set; }
    public DateTime CreatedAt { get; set; }
    public bool IsChanged { get; set; } = false;
}
