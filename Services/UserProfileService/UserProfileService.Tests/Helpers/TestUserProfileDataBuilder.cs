using DAL.Entities;

namespace UserProfileService.Tests.Helpers;

public static class TestUserProfileDataBuilder
{
    public static UserProfile CreateEntity(string id = "abcdefghij",
        string first_name = "John",
        string last_name = "Doe",
        DateTime birth_date = default,
        string bio = "HELLO I AM CREATED TEST ENTITY")
    {
        if (birth_date == default)
        {
            birth_date = new DateTime(2000, 1, 1);
        }
        return new UserProfile { user_id = id, first_name = first_name, last_name = last_name, birth_date = birth_date, bio = bio, created_at = DateTime.Now};
    }
    
    public static List<UserProfile> CreateEntities(int count = 3) =>
        Enumerable.Range(0, count).Select(i => CreateEntity(i.ToString())).ToList();
}