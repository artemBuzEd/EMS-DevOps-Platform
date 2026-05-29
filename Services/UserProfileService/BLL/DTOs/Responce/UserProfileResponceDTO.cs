namespace BLL.DTOs.Responce;

public class UserProfileResponceDTO
{
    public string user_id { get; set; }
    public string first_name { get; set; }
    public string last_name { get; set; }
    public string bio { get; set; }
    public DateTime birth_date { get; set; }
    public DateTime created_at { get; set; }
    public string? avatar_url { get; set; }
}