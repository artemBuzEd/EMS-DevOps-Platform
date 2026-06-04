using System.Net;
using System.Net.Http.Json;
using DAL.EntityConfig;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using UserProfileService.IntegrationTests.Infrastructure;

namespace UserProfileService.IntegrationTests.Controllers;

public class AvatarUploadTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    // Avatar upload is owner-only: the route id must match the test principal's token.
    private const string Sub = TestAuthHandler.DefaultSub;

    public AvatarUploadTests(CustomWebApplicationFactory factory)
    {
        factory.InitializeDb();
        _client = factory.CreateClient();

        var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<UserProfileDbContext>();
        DatabaseSeeder.Seed(db);
    }

    private static ByteArrayContent CreateMinimalPng()
    {
        var pngBytes = new byte[]
        {
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
            0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
            0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1
            0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, // 8-bit RGB
            0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, // IDAT chunk
            0x54, 0x08, 0xD7, 0x63, 0xF8, 0xCF, 0xC0, 0x00,
            0x00, 0x00, 0x02, 0x00, 0x01, 0xE2, 0x21, 0xBC,
            0x33, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, // IEND chunk
            0x44, 0xAE, 0x42, 0x60, 0x82
        };
        var content = new ByteArrayContent(pngBytes);
        content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("image/png");
        return content;
    }

    [Fact]
    public async Task UploadAvatar_ValidPng_ReturnsOkWithImageUrl()
    {
        using var form = new MultipartFormDataContent();
        form.Add(CreateMinimalPng(), "file", "avatar.png");

        var response = await _client.PostAsync($"/api/users/UserProfile/{Sub}/avatar", form);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<Dictionary<string, string>>();
        body.Should().ContainKey("imageUrl");
        body!["imageUrl"].Should().Contain("/uploads/avatars/");
    }

    [Fact]
    public async Task UploadAvatar_OtherUsersProfile_ReturnsForbidden()
    {
        // The test principal is "test-user-sub"; uploading to user "1" must be rejected
        // (upload is owner-only — no admin bypass).
        using var form = new MultipartFormDataContent();
        form.Add(CreateMinimalPng(), "file", "avatar.png");

        var response = await _client.PostAsync("/api/users/UserProfile/1/avatar", form);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task UploadAvatar_InvalidContentType_Returns415()
    {
        var exeBytes = new byte[] { 0x4D, 0x5A, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00 };
        var content = new ByteArrayContent(exeBytes);
        content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("application/octet-stream");

        using var form = new MultipartFormDataContent();
        form.Add(content, "file", "malware.exe");

        var response = await _client.PostAsync($"/api/users/UserProfile/{Sub}/avatar", form);

        response.StatusCode.Should().Be(HttpStatusCode.UnsupportedMediaType);
    }

    [Fact]
    public async Task UploadAvatar_FakeJpegMagicBytes_Returns415()
    {
        // EXE bytes with content-type claiming JPEG
        var exeBytes = new byte[] { 0x4D, 0x5A, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00 };
        var content = new ByteArrayContent(exeBytes);
        content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("image/jpeg");

        using var form = new MultipartFormDataContent();
        form.Add(content, "file", "not-a-real-image.jpg");

        var response = await _client.PostAsync($"/api/users/UserProfile/{Sub}/avatar", form);

        response.StatusCode.Should().Be(HttpStatusCode.UnsupportedMediaType);
    }

    [Fact]
    public async Task GetAvatar_AfterUpload_ReturnsImageUrl()
    {
        using var form = new MultipartFormDataContent();
        form.Add(CreateMinimalPng(), "file", "avatar.png");
        await _client.PostAsync($"/api/users/UserProfile/{Sub}/avatar", form);

        var response = await _client.GetAsync($"/api/users/UserProfile/{Sub}/avatar");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<Dictionary<string, string>>();
        body!["imageUrl"].Should().Contain("/uploads/avatars/");
    }

    [Fact]
    public async Task DeleteAvatar_ReturnsNoContent()
    {
        using var form = new MultipartFormDataContent();
        form.Add(CreateMinimalPng(), "file", "avatar.png");
        await _client.PostAsync($"/api/users/UserProfile/{Sub}/avatar", form);

        var deleteResponse = await _client.DeleteAsync($"/api/users/UserProfile/{Sub}/avatar");
        deleteResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var getResponse = await _client.GetAsync($"/api/users/UserProfile/{Sub}/avatar");
        getResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task UploadAvatar_UserDtoContainsAvatarUrl()
    {
        using var form = new MultipartFormDataContent();
        form.Add(CreateMinimalPng(), "file", "avatar.png");
        await _client.PostAsync($"/api/users/UserProfile/{Sub}/avatar", form);

        var response = await _client.GetAsync($"/api/users/UserProfile/{Sub}");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<Dictionary<string, object>>();
        body.Should().ContainKey("avatar_url");
        body!["avatar_url"].Should().NotBeNull();
    }
}
