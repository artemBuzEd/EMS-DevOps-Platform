namespace Common.FileStorage;

public class LocalFileStorage : IFileStorage
{
    private readonly string _basePath;
    private readonly string _baseUrl;

    public LocalFileStorage(string basePath, string baseUrl)
    {
        _basePath = basePath;
        _baseUrl = baseUrl.TrimEnd('/');
    }

    public async Task<string> SaveAsync(Stream content, string fileName, string contentType, CancellationToken ct = default)
    {
        var filePath = Path.Combine(_basePath, fileName);
        var directory = Path.GetDirectoryName(filePath);
        if (directory != null)
            Directory.CreateDirectory(directory);

        await using var fileStream = new FileStream(filePath, FileMode.Create, FileAccess.Write, FileShare.None, 8192, useAsync: true);
        await content.CopyToAsync(fileStream, ct);
        return fileName;
    }

    public Task DeleteAsync(string key, CancellationToken ct = default)
    {
        var filePath = Path.Combine(_basePath, key);
        if (File.Exists(filePath))
            File.Delete(filePath);
        return Task.CompletedTask;
    }

    public string GetPublicUrl(string key)
    {
        return $"{_baseUrl}/{key}";
    }
}
