using DAL.Entities;
using DAL.Entities.HelpModels;
using DAL.EntityConfig;
using DAL.Helpers;
using DAL.Repositories;
using FluentAssertions;
using Moq;
using UserProfileService.Tests.Helpers;
using Xunit;

namespace UserProfileService.Tests.UnitTests;

public class UserProfileRepositoryTests : IDisposable
{
    private readonly UserProfileDbContext context;
    private readonly UserProfileRepository _sut;
    

    public UserProfileRepositoryTests()
    {
        context = DbContextFactory.Create();
        _sut = new UserProfileRepository(context);
    }
    
    [Fact]
    public async Task GetByName_ExistingNames_ShouldReturnUserProfiles()
    {
        var entities = TestUserProfileDataBuilder.CreateEntities();
        await context.UserProfiles.AddRangeAsync(entities);
        await context.SaveChangesAsync();

        var result = await _sut.GetByName("John", "Doe");
        
        var userProfiles = result.ToList();
        userProfiles.Should().NotBeNull();
        userProfiles.Should().BeEquivalentTo(entities);
        userProfiles.Count.Should().Be(entities.Count());
    }
    
    [Fact]
    public async Task GetByName_NonExistingNames_ShouldReturnEmptyList()
    {
        var entities = TestUserProfileDataBuilder.CreateEntities();
        await context.UserProfiles.AddRangeAsync(entities);
        await context.SaveChangesAsync();
        
        var result = await _sut.GetByName("Alice", "Alice");
        
        var userProfiles = result.ToList();
        Assert.Empty(userProfiles);
    }
    
    [Fact]
    public async Task GetAllPaginatedAsync_ExistingUsers_ShouldReturnAllPaginatedUsers()
    {
        var parameters = new UserProfileParameters
        {
            first_name = "John",
            PageSize = 5,
            PageNumber = 1
        };
        
        var userProfiles = TestUserProfileDataBuilder.CreateEntities(10);
        context.UserProfiles.AddRange(userProfiles);
        
        await context.SaveChangesAsync();
        
        var result = await _sut.GetAllPaginatedAsync(parameters, new SortHelper<UserProfile>());
        
        Assert.Equal(5, result.Count());
        Assert.Equal(1, result.CurrentPage);
        Assert.Equal(5, result.PageSize);
    }
    
    public void Dispose() => context.Dispose();
    
}