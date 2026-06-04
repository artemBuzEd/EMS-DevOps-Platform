namespace Aggregator.DTOs;

public class CommentDto
{
    public int id { get; set; }
    public string user_id { get; set; }
    public string event_id { get; set; }
    public string comment { get; set; }
    public int rating { get; set; }
    public DateTime added_at { get; set; }
    public bool is_changed {get; set;}
    public CommentUserDto? user { get; set; }
}

public class CommentUserDto
{
    public string user_id { get; set; }
    public string first_name { get; set; }
    public string last_name { get; set; }
}