using DAL.EntityConfig;
using Microsoft.EntityFrameworkCore;

namespace UserProfileService.Tests.Helpers;

public static class DbContextFactory
{
    public static UserProfileDbContext Create()
    {
        var options = new DbContextOptionsBuilder<UserProfileDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        
        var context = new UserProfileDbContext(options);
        context.Database.EnsureCreated();
        return context;
    }
}