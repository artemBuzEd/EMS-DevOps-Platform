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
    public async Task UpdateUser_OwnProfile_ReturnsNoContent()
    {
        var dto = new
        {
            first_name = "Updated",
            last_name = "Name",
            bio = "updated bio",
            birth_date = new DateTime(2000,1,1)
        };

        // Owner-only: target the user whose id matches the test principal's token.
        var response = await _client.PutAsJsonAsync(
            $"/api/users/UserProfile/{TestAuthHandler.DefaultSub}", dto);

        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task UpdateUser_OtherUsersProfile_ReturnsForbidden()
    {
        var dto = new
        {
            first_name = "Hijack",
            last_name = "Attempt",
            bio = "should not persist",
            birth_date = new DateTime(2000,1,1)
        };

        // The test principal is "test-user-sub"; editing user "1" must be rejected even
        // though the caller is authenticated (and even though they're an admin — PUT is owner-only).
        var response = await _client.PutAsJsonAsync("/api/users/UserProfile/1", dto);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task GetUserById_NonOwnerNonAdmin_ReturnsForbidden()
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/users/UserProfile/2");
        request.Headers.Add("X-Test-Roles", "user"); // authenticated, but not admin and not the owner

        var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
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