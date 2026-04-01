using DAL.Entities;
using DAL.EntityConfig;
using DAL.Repositories;
using FluentAssertions;
using UserProfileService.Tests.Helpers;
using Xunit;

namespace UserProfileService.Tests.UnitTests;

public class GenericRepositoryTests : IDisposable
{
    private readonly UserProfileDbContext context;
    private readonly GenericRepository<UserProfile> _sut;

    public GenericRepositoryTests()
    {
        context = DbContextFactory.Create();
        _sut = new GenericRepository<UserProfile>(context);
    }
    
    [Fact]
    public async Task GetAllAsync_ExistingEntities_ShouldReturnUserProfileEntities()
    {
        var entities = TestUserProfileDataBuilder.CreateEntities();
        await context.Set<UserProfile>().AddRangeAsync(entities);
        await context.SaveChangesAsync();

        var result = await _sut.GetAllAsync();

        var userProfiles = result.ToList();
        userProfiles.Should().NotBeNull().And.BeEquivalentTo(entities);
        userProfiles.Count().Should().Be(entities.Count());
    }

    [Fact]
    public async Task GetAllAsync_NonExistingEntities_ShouldReturnEmptyList()
    {
        var result = await _sut.GetAllAsync();
        
        Assert.Empty(result);
    }
    
    public void Dispose() => context.Dispose();
}