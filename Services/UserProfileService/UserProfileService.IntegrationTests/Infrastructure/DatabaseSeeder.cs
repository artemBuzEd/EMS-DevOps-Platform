using DAL.Entities;
using DAL.EntityConfig;

namespace UserProfileService.IntegrationTests.Infrastructure;

public static class DatabaseSeeder
{
    public static void Seed(UserProfileDbContext context)
    {
        context.UserProfiles.RemoveRange(context.UserProfiles);
        context.SaveChanges();

        context.UserProfiles.AddRange(
            new UserProfile
            {
                user_id = "1",
                first_name = "John",
                last_name = "Doe",
                bio = "Test user",
                birth_date = new DateTime(2000, 1, 1),
                created_at = DateTime.UtcNow
            },
            new UserProfile
            {
                user_id = "2",
                first_name = "Alice",
                last_name = "Smith",
                bio = "Another user",
                birth_date = new DateTime(1998, 5, 10),
                created_at = DateTime.UtcNow
            }
        );

        context.SaveChanges();
    }
}