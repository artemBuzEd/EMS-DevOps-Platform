namespace Common.FileStorage;

public static class FileStorageKeyHelper
{
    public static string? ExtractKey(string url, string segment = "/uploads/")
    {
        if (string.IsNullOrEmpty(url))
            return null;

        var index = url.IndexOf(segment, StringComparison.OrdinalIgnoreCase);
        if (index < 0)
            return null;

        return url[(index + segment.Length)..];
    }
}
