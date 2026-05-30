using Common.FileStorage;
using FluentAssertions;

namespace EventCatalogApi.IntegrationTests.Unit;

public class LocalFileStorageTests : IDisposable
{
    private readonly string _basePath;
    private readonly LocalFileStorage _storage;

    public LocalFileStorageTests()
    {
        _basePath = Path.Combine(Path.GetTempPath(), $"local-storage-test-{Guid.NewGuid()}");
        Directory.CreateDirectory(_basePath);
        _storage = new LocalFileStorage(_basePath, "/uploads");
    }

    [Fact]
    public async Task SaveAsync_WritesBytesToDisk_AndReturnsKey()
    {
        var payload = new byte[] { 1, 2, 3, 4 };
        await using var stream = new MemoryStream(payload);

        var key = await _storage.SaveAsync(stream, "events/foo.png", "image/png");

        key.Should().Be("events/foo.png");
        var diskPath = Path.Combine(_basePath, key);
        File.Exists(diskPath).Should().BeTrue();
        (await File.ReadAllBytesAsync(diskPath)).Should().Equal(payload);
    }

    [Fact]
    public async Task DeleteAsync_RemovesFile()
    {
        var diskPath = Path.Combine(_basePath, "todelete.bin");
        await File.WriteAllBytesAsync(diskPath, new byte[] { 9 });

        await _storage.DeleteAsync("todelete.bin");

        File.Exists(diskPath).Should().BeFalse();
    }

    [Fact]
    public async Task DeleteAsync_MissingFile_DoesNotThrow()
    {
        var act = async () => await _storage.DeleteAsync("never-existed.bin");
        await act.Should().NotThrowAsync();
    }

    [Fact]
    public void GetPublicUrl_BuildsUrlFromBaseAndKey()
    {
        _storage.GetPublicUrl("events/foo.png").Should().Be("/uploads/events/foo.png");
    }

    public void Dispose()
    {
        if (Directory.Exists(_basePath))
            Directory.Delete(_basePath, true);
    }
}
