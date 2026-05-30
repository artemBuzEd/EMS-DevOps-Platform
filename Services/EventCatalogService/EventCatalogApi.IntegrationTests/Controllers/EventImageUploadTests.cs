using System.Net;
using System.Net.Http.Headers;
using EventCatalogApi.IntegrationTests.Helpers;
using EventCatalogApi.IntegrationTests.Infrastructure;
using FluentAssertions;

namespace EventCatalogApi.IntegrationTests.Controllers;

public class EventImageUploadTests : IClassFixture<CustomWebApplicationFactory>, IDisposable
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public EventImageUploadTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _factory.Repository.Reset();
        var dir = new DirectoryInfo(_factory.TestUploadPath);
        foreach (var f in dir.GetFiles("*", SearchOption.AllDirectories)) f.Delete();
        _client = factory.CreateClient();
    }

    public void Dispose() => _factory.Repository.Reset();

    private static MultipartFormDataContent BuildCreateForm(byte[]? imageBytes, string imageContentType = "image/png")
    {
        var form = new MultipartFormDataContent
        {
            { new StringContent("Demo Event"), "Title" },
            { new StringContent("Description text long enough"), "Description" },
            { new StringContent("2026-07-01T18:00:00Z"), "StartDate" },
            { new StringContent("2026-07-01T20:00:00Z"), "EndDate" },
            { new StringContent("CityName"), "City" },
            { new StringContent("Street Address 1"), "Address" },
            { new StringContent("CountryName"), "Country" },
            { new StringContent("Music"), "CategoryName" },
            { new StringContent("Music category"), "CategoryDescription" },
            { new StringContent("1"), "VenueId" },
            { new StringContent("10"), "Capacity" },
        };
        if (imageBytes != null)
        {
            var imagePart = new ByteArrayContent(imageBytes);
            imagePart.Headers.ContentType = new MediaTypeHeaderValue(imageContentType);
            form.Add(imagePart, "Image", $"pic{Path.GetExtension(imageContentType.Replace("image/", "."))}");
        }
        return form;
    }

    private static MultipartFormDataContent BuildUpdateForm(byte[]? imageBytes, string imageContentType = "image/png")
    {
        var form = new MultipartFormDataContent
        {
            { new StringContent("Updated Demo"), "Title" },
            { new StringContent("Updated description text"), "Description" },
            { new StringContent("2026-08-01T18:00:00Z"), "StartDate" },
            { new StringContent("2026-08-01T20:00:00Z"), "EndDate" },
            { new StringContent("CountryName"), "Country" },
            { new StringContent("CityName"), "City" },
            { new StringContent("Street Address 2"), "Address" },
            { new StringContent("20"), "Capacity" },
        };
        if (imageBytes != null)
        {
            var imagePart = new ByteArrayContent(imageBytes);
            imagePart.Headers.ContentType = new MediaTypeHeaderValue(imageContentType);
            form.Add(imagePart, "Image", "pic.png");
        }
        return form;
    }

    [Fact]
    public async Task Create_MultipartWithPng_Returns201_AndImageFileOnDisk()
    {
        var response = await _client.PostAsync("/api/events/multipart", BuildCreateForm(TestImages.ValidPng()));

        response.StatusCode.Should().Be(HttpStatusCode.Created);

        var entity = (await _factory.Repository.GetAllAsync()).Single();
        entity.PictureUrl.Should().NotBeNullOrEmpty();
        entity.PictureUrl!.Should().StartWith("/uploads/events/");

        var diskPath = Path.Combine(_factory.TestUploadPath, entity.PictureUrl["/uploads/".Length..]);
        File.Exists(diskPath).Should().BeTrue();
        (await File.ReadAllBytesAsync(diskPath)).Should().Equal(TestImages.ValidPng());

        await CleanupAsync(entity.Id);
    }

    [Fact]
    public async Task Create_MultipartWithoutImage_Returns201_AndNoPictureUrl()
    {
        var response = await _client.PostAsync("/api/events/multipart", BuildCreateForm(null));

        response.StatusCode.Should().Be(HttpStatusCode.Created);

        var entity = (await _factory.Repository.GetAllAsync()).Single();
        entity.PictureUrl.Should().BeNull();

        await CleanupAsync(entity.Id);
    }

    [Fact]
    public async Task Update_WithoutImage_PreservesPictureUrl_AndKeepsFileOnDisk()
    {
        // arrange — create with image
        await _client.PostAsync("/api/events/multipart", BuildCreateForm(TestImages.ValidPng()));
        var entity = (await _factory.Repository.GetAllAsync()).Single();
        var originalUrl = entity.PictureUrl!;
        var originalDiskPath = Path.Combine(_factory.TestUploadPath, originalUrl["/uploads/".Length..]);

        // act — update without image
        var response = await _client.PutAsync($"/api/events/multipart/fullUpdate/{entity.Id}", BuildUpdateForm(null));

        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
        var updated = await _factory.Repository.GetByIdAsync(entity.Id);
        updated!.PictureUrl.Should().Be(originalUrl);
        File.Exists(originalDiskPath).Should().BeTrue();

        await CleanupAsync(entity.Id);
    }

    [Fact]
    public async Task Update_WithNewImage_DeletesOldFile_AndPersistsNew()
    {
        await _client.PostAsync("/api/events/multipart", BuildCreateForm(TestImages.ValidPng()));
        var entity = (await _factory.Repository.GetAllAsync()).Single();
        var originalUrl = entity.PictureUrl!;
        var originalDiskPath = Path.Combine(_factory.TestUploadPath, originalUrl["/uploads/".Length..]);

        var response = await _client.PutAsync(
            $"/api/events/multipart/fullUpdate/{entity.Id}",
            BuildUpdateForm(TestImages.ValidJpeg(), "image/jpeg"));

        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
        File.Exists(originalDiskPath).Should().BeFalse();

        var updated = await _factory.Repository.GetByIdAsync(entity.Id);
        updated!.PictureUrl.Should().NotBe(originalUrl);
        var newDiskPath = Path.Combine(_factory.TestUploadPath, updated.PictureUrl!["/uploads/".Length..]);
        File.Exists(newDiskPath).Should().BeTrue();

        await CleanupAsync(entity.Id);
    }

    [Fact]
    public async Task UploadPicture_PdfMasqueradingAsPng_Returns415()
    {
        await _client.PostAsync("/api/events/multipart", BuildCreateForm(null));
        var entity = (await _factory.Repository.GetAllAsync()).Single();

        var form = new MultipartFormDataContent();
        var part = new ByteArrayContent(TestImages.PdfBytes());
        part.Headers.ContentType = new MediaTypeHeaderValue("image/png");
        form.Add(part, "file", "fake.png");

        var response = await _client.PostAsync($"/api/events/{entity.Id}/picture", form);

        response.StatusCode.Should().Be(HttpStatusCode.UnsupportedMediaType);
        await CleanupAsync(entity.Id);
    }

    [Fact]
    public async Task UploadPicture_OverSized_Returns413OrBodyLimit()
    {
        await _client.PostAsync("/api/events/multipart", BuildCreateForm(null));
        var entity = (await _factory.Repository.GetAllAsync()).Single();

        // 6 MB+ payload — exceeds both ImageValidator (5MB) and Kestrel (6MB) caps.
        var oversized = new byte[6 * 1024 * 1024 + 1];
        oversized[0] = 0x89; oversized[1] = 0x50; oversized[2] = 0x4E; oversized[3] = 0x47;
        oversized[4] = 0x0D; oversized[5] = 0x0A; oversized[6] = 0x1A; oversized[7] = 0x0A;

        var form = new MultipartFormDataContent();
        var part = new ByteArrayContent(oversized);
        part.Headers.ContentType = new MediaTypeHeaderValue("image/png");
        form.Add(part, "file", "big.png");

        var response = await _client.PostAsync($"/api/events/{entity.Id}/picture", form);

        // Kestrel may reject at body-read time (BadRequest) or controller may surface 413.
        response.StatusCode.Should().BeOneOf(HttpStatusCode.RequestEntityTooLarge, HttpStatusCode.BadRequest);
        await CleanupAsync(entity.Id);
    }

    [Fact]
    public async Task Delete_EventWithImage_RemovesFileFromDisk()
    {
        await _client.PostAsync("/api/events/multipart", BuildCreateForm(TestImages.ValidPng()));
        var entity = (await _factory.Repository.GetAllAsync()).Single();
        var diskPath = Path.Combine(_factory.TestUploadPath, entity.PictureUrl!["/uploads/".Length..]);
        File.Exists(diskPath).Should().BeTrue();

        var response = await _client.DeleteAsync($"/api/events/{entity.Id}");

        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
        File.Exists(diskPath).Should().BeFalse();
    }

    private async Task CleanupAsync(string id)
    {
        var entity = await _factory.Repository.GetByIdAsync(id);
        if (entity is null) return;
        if (!string.IsNullOrEmpty(entity.PictureUrl))
        {
            var path = Path.Combine(_factory.TestUploadPath, entity.PictureUrl["/uploads/".Length..]);
            if (File.Exists(path)) File.Delete(path);
        }
        await _factory.Repository.DeleteAsync(id);
    }
}
