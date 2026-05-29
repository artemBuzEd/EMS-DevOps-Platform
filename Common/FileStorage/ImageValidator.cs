namespace Common.FileStorage;

public static class ImageValidator
{
    public const long MaxFileSize = 5 * 1024 * 1024; // 5 MB

    private static readonly Dictionary<string, byte[][]> MagicBytes = new()
    {
        ["image/jpeg"] = [new byte[] { 0xFF, 0xD8, 0xFF }],
        ["image/png"] = [new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A }],
        ["image/webp"] = [new byte[] { 0x52, 0x49, 0x46, 0x46 }] // RIFF header; "WEBP" at offset 8 checked separately
    };

    private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg",
        "image/png",
        "image/webp"
    };

    public static ImageValidationResult Validate(Stream fileStream, string contentType, long fileSize)
    {
        if (fileSize > MaxFileSize)
            return ImageValidationResult.TooLarge;

        if (!AllowedContentTypes.Contains(contentType))
            return ImageValidationResult.UnsupportedType;

        if (!ValidateMagicBytes(fileStream, contentType))
            return ImageValidationResult.InvalidMagicBytes;

        return ImageValidationResult.Valid;
    }

    private static bool ValidateMagicBytes(Stream stream, string contentType)
    {
        if (!MagicBytes.TryGetValue(contentType, out var signatures))
            return false;

        var position = stream.Position;
        try
        {
            var headerBuffer = new byte[12];
            var bytesRead = stream.Read(headerBuffer, 0, headerBuffer.Length);
            if (bytesRead < 4)
                return false;

            foreach (var signature in signatures)
            {
                if (bytesRead < signature.Length)
                    continue;

                var match = true;
                for (var i = 0; i < signature.Length; i++)
                {
                    if (headerBuffer[i] != signature[i])
                    {
                        match = false;
                        break;
                    }
                }

                if (!match) continue;

                if (contentType == "image/webp")
                {
                    if (bytesRead < 12) return false;
                    return headerBuffer[8] == 0x57 && // W
                           headerBuffer[9] == 0x45 && // E
                           headerBuffer[10] == 0x42 && // B
                           headerBuffer[11] == 0x50;   // P
                }

                return true;
            }

            return false;
        }
        finally
        {
            stream.Position = position;
        }
    }

    public static string GetExtension(string contentType)
    {
        return contentType switch
        {
            "image/jpeg" => ".jpg",
            "image/png" => ".png",
            "image/webp" => ".webp",
            _ => ".bin"
        };
    }
}

public enum ImageValidationResult
{
    Valid,
    TooLarge,
    UnsupportedType,
    InvalidMagicBytes
}
