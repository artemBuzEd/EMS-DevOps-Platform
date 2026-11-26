using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using BLL.DTOs.Responce;
using DAL.EntityConfig;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using UserProfileService.IntegrationTests.Infrastructure;

namespace UserProfileService.IntegrationTests.Controllers;

public class UserCommentControllerTests : IDisposable
{
    private const string CommentsUrl = "/api/users/UserComment";
    private const string AuthorId = "1";
    private const string OtherUserId = "2";
    private readonly HttpClient _client;

    private readonly CustomWebApplicationFactory _factory = new();

    public UserCommentControllerTests()
    {
        _factory.InitializeDb();
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<UserProfileDbContext>();
        DatabaseSeeder.Seed(db);
        _client = _factory.CreateClient();
        _client.DefaultRequestHeaders.Authorization = null;
    }

    public void Dispose()
    {
        _client.Dispose();
        _factory.Dispose();
    }

    [Theory]
    [InlineData(AuthorId, "user", HttpStatusCode.NoContent)]
    [InlineData(OtherUserId, "user", HttpStatusCode.Forbidden)]
    [InlineData(OtherUserId, "admin", HttpStatusCode.Forbidden)]
    [InlineData(null, null, HttpStatusCode.Unauthorized)]
    public async Task EditComment_RequiresAuthor(string? subject, string? role, HttpStatusCode expectedStatus)
    {
        var original = await CreateComment();
        using var request = CreateRequest(HttpMethod.Put, original.id, subject, role);
        request.Content = JsonContent.Create(new { comment = "Updated comment", rating = 5 });

        using var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(expectedStatus);
        var comment = await _client.GetFromJsonAsync<UserCommentResponceDTO>($"{CommentsUrl}/{original.id}");
        if (expectedStatus == HttpStatusCode.NoContent)
        {
            comment!.comment.Should().Be("Updated comment");
            comment.rating.Should().Be(5);
            comment.user_id.Should().Be(AuthorId);
        }
        else
        {
            comment.Should().BeEquivalentTo(original);
        }
    }

    [Theory]
    [InlineData(AuthorId, "user", HttpStatusCode.NoContent)]
    [InlineData(OtherUserId, "admin", HttpStatusCode.NoContent)]
    [InlineData(OtherUserId, "user", HttpStatusCode.Forbidden)]
    [InlineData(null, null, HttpStatusCode.Unauthorized)]
    public async Task DeleteComment_RequiresAuthorOrAdmin(string? subject, string? role, HttpStatusCode expectedStatus)
    {
        var original = await CreateComment();
        using var request = CreateRequest(HttpMethod.Delete, original.id, subject, role);

        using var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(expectedStatus);
        using var getResponse = await _client.GetAsync($"{CommentsUrl}/ByEventId/{original.event_id}");
        getResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var comments = await getResponse.Content.ReadFromJsonAsync<List<UserCommentResponceDTO>>();
        if (expectedStatus == HttpStatusCode.NoContent)
            comments.Should().BeEmpty();
        else
            comments.Should().BeEquivalentTo(new[] { original });
    }

    [Theory]
    [InlineData("PUT")]
    [InlineData("DELETE")]
    public async Task MutateComment_MissingComment_ReturnsNotFound(string method)
    {
        using var request = CreateRequest(new HttpMethod(method), int.MaxValue, AuthorId, "user");
        if (method == "PUT")
            request.Content = JsonContent.Create(new { comment = "Updated comment", rating = 5 });

        using var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task CreateComment_AppearsInPreviouslyReadAuthorList()
    {
        var before = await GetAuthorComments();

        var created = await CreateComment();

        var after = await GetAuthorComments();
        after.Select(comment => comment.id).Should().BeEquivalentTo(
            before.Select(comment => comment.id).Append(created.id));
    }

    [Fact]
    public async Task EditComment_UpdatesPreviouslyReadAuthorList()
    {
        var original = await CreateComment();
        var before = await GetAuthorComments();
        before.Should().Contain(comment => comment.id == original.id && comment.comment == original.comment);

        using var request = CreateRequest(HttpMethod.Put, original.id, AuthorId, "user");
        request.Content = JsonContent.Create(new { comment = "Updated comment", rating = 5 });
        using var response = await _client.SendAsync(request);
        response.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var after = await GetAuthorComments();
        after.Should().ContainSingle(comment => comment.id == original.id)
            .Which.Should().Match<UserCommentResponceDTO>(
                comment => comment.comment == "Updated comment" && comment.rating == 5);
    }

    [Theory]
    [InlineData(AuthorId, "user")]
    [InlineData(OtherUserId, "admin")]
    public async Task DeleteComment_RemovesCommentFromPreviouslyReadAuthorList(string subject, string role)
    {
        var original = await CreateComment();
        var before = await GetAuthorComments();
        before.Should().Contain(comment => comment.id == original.id);

        using var request = CreateRequest(HttpMethod.Delete, original.id, subject, role);
        using var response = await _client.SendAsync(request);
        response.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var after = await GetAuthorComments();
        after.Select(comment => comment.id).Should().BeEquivalentTo(
            before.Select(comment => comment.id).Where(id => id != original.id));
    }

    private async Task<List<UserCommentResponceDTO>> GetAuthorComments()
    {
        return (await _client.GetFromJsonAsync<List<UserCommentResponceDTO>>(
            $"{CommentsUrl}/ByUserId/{AuthorId}"))!;
    }

    private async Task<UserCommentResponceDTO> CreateComment()
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, CommentsUrl);
        Authenticate(request, AuthorId, "user");
        request.Content = JsonContent.Create(new
        {
            event_id = Guid.NewGuid().ToString(),
            comment = "Original comment",
            rating = 3
        });

        using var response = await _client.SendAsync(request);
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        return (await response.Content.ReadFromJsonAsync<UserCommentResponceDTO>())!;
    }

    private static HttpRequestMessage CreateRequest(HttpMethod method, int commentId, string? subject, string? role)
    {
        var request = new HttpRequestMessage(method, $"{CommentsUrl}/{commentId}");
        if (subject is not null)
            Authenticate(request, subject, role ?? string.Empty);

        return request;
    }

    private static void Authenticate(HttpRequestMessage request, string subject, string role)
    {
        request.Headers.Authorization = new AuthenticationHeaderValue(TestAuthHandler.SchemeName);
        request.Headers.Add("X-Test-Sub", subject);
        request.Headers.Add("X-Test-Roles", role);
    }
}
