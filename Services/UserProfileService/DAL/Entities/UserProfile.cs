namespace DAL.Entities;

public class UserProfile
{
    public string user_id { get; set; } //reference to Keycloak service
    public string first_name { get; set; }
    public string last_name { get; set; }
    public string bio { get; set; }
    public DateTime birth_date { get; set; }
    public DateTime created_at { get; set; }
    public string? avatar_url { get; set; }

    public virtual ICollection<UserEventCalendar> EventCalendar { get; set; }
    public virtual ICollection<UserComment> Comments { get; set; }
}