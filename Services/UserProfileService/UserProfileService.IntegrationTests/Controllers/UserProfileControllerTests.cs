using System.Net;
using System.Net.Http.Json;
using DAL.EntityConfig;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using UserProfileService.IntegrationTests.Infrastructure;

namespace UserProfileService.IntegrationTests.Controllers;

public class UserProfileControllerTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly UserProfileDbContext _db;

    public UserProfileControllerTests(CustomWebApplicationFactory factory)
    {
        factory.InitializeDb();
        _client = factory.CreateClient();

        var scope = factory.Services.CreateScope();
        _db = scope.ServiceProvider.GetRequiredService<UserProfileDbContext>();

        DatabaseSeeder.Seed(_db);
    }

    [Fact]
    public async Task GetAllUsers_ReturnsUsers()
    {
        var response = await _client.GetAsync("/api/users/UserProfile");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var users = await response.Content.ReadFromJsonAsync<List<object>>();

        users.Should().NotBeNull();
        users.Count.Should().BeGreaterThanOrEqualTo(2);
    }

    [Fact]
    public async Task GetUserById_ExistingUser_ReturnsUser()
    {
        var response = await _client.GetAsync("/api/users/UserProfile/1");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetUserById_NotExisting_ReturnsNotFound()
    {
        var response = await _client.GetAsync("/api/users/UserProfile/999");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task CreateUser_ValidRequest_ReturnsCreated()
    {
        var dto = new
        {
            user_id = "10",
            first_name = "Integration",
            last_name = "Test",
            bio = "created by test",
            birth_date = new DateTime(2001,1,1)
        };

        var response = await _client.PostAsJsonAsync("/api/users/UserProfile", dto);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
    }

    [Fact]
    public async Task UpdateUser_ReturnsNoContent()
    {
        var dto = new
        {
            first_name = "Updated",
            last_name = "Name",
            bio = "updated bio",
            birth_date = new DateTime(2000,1,1)
        };

        var response = await _client.PutAsJsonAsync("/api/users/UserProfile/1", dto);

        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task DeleteUser_RemovesEntity()
    {
        var response = await _client.DeleteAsync("/api/users/UserProfile/2");

        response.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var getResponse = await _client.GetAsync("/api/users/UserProfile/2");

        getResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}