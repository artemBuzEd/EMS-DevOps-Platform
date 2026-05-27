using Common.FileStorage;
using FluentAssertions;
using Xunit;

namespace UserProfileService.Tests.UnitTests;

public class ImageValidatorTests
{
    private static MemoryStream CreatePngStream()
    {
        var header = new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D };
        return new MemoryStream(header);
    }

    private static MemoryStream CreateJpegStream()
    {
        var header = new byte[] { 0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10 };
        return new MemoryStream(header);
    }

    private static MemoryStream CreateWebpStream()
    {
        // RIFF....WEBP
        var header = new byte[] { 0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50 };
        return new MemoryStream(header);
    }

    [Fact]
    public void Validate_ValidPng_ReturnsValid()
    {
        using var stream = CreatePngStream();
        var result = ImageValidator.Validate(stream, "image/png", stream.Length);
        result.Should().Be(ImageValidationResult.Valid);
    }

    [Fact]
    public void Validate_ValidJpeg_ReturnsValid()
    {
        using var stream = CreateJpegStream();
        var result = ImageValidator.Validate(stream, "image/jpeg", stream.Length);
        result.Should().Be(ImageValidationResult.Valid);
    }

    [Fact]
    public void Validate_ValidWebp_ReturnsValid()
    {
        using var stream = CreateWebpStream();
        var result = ImageValidator.Validate(stream, "image/webp", stream.Length);
        result.Should().Be(ImageValidationResult.Valid);
    }

    [Fact]
    public void Validate_FileTooLarge_ReturnsTooLarge()
    {
        using var stream = CreatePngStream();
        var result = ImageValidator.Validate(stream, "image/png", 6 * 1024 * 1024);
        result.Should().Be(ImageValidationResult.TooLarge);
    }

    [Fact]
    public void Validate_UnsupportedContentType_ReturnsUnsupportedType()
    {
        using var stream = CreatePngStream();
        var result = ImageValidator.Validate(stream, "application/pdf", stream.Length);
        result.Should().Be(ImageValidationResult.UnsupportedType);
    }

    [Fact]
    public void Validate_WrongMagicBytes_ReturnsInvalidMagicBytes()
    {
        // EXE-like bytes but claiming to be PNG
        var exeBytes = new byte[] { 0x4D, 0x5A, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00 };
        using var stream = new MemoryStream(exeBytes);
        var result = ImageValidator.Validate(stream, "image/png", stream.Length);
        result.Should().Be(ImageValidationResult.InvalidMagicBytes);
    }

    [Fact]
    public void Validate_RenamedExeAsJpeg_ReturnsInvalidMagicBytes()
    {
        var exeBytes = new byte[] { 0x4D, 0x5A, 0x90, 0x00, 0x03, 0x00 };
        using var stream = new MemoryStream(exeBytes);
        var result = ImageValidator.Validate(stream, "image/jpeg", stream.Length);
        result.Should().Be(ImageValidationResult.InvalidMagicBytes);
    }

    [Fact]
    public void Validate_StreamPositionResetAfterValidation()
    {
        using var stream = CreatePngStream();
        stream.Position = 0;
        ImageValidator.Validate(stream, "image/png", stream.Length);
        stream.Position.Should().Be(0);
    }

    [Theory]
    [InlineData("image/jpeg", ".jpg")]
    [InlineData("image/png", ".png")]
    [InlineData("image/webp", ".webp")]
    [InlineData("image/gif", ".bin")]
    public void GetExtension_ReturnsCorrectExtension(string contentType, string expected)
    {
        ImageValidator.GetExtension(contentType).Should().Be(expected);
    }

    [Fact]
    public void Validate_ExactlyAtSizeLimit_ReturnsValid()
    {
        using var stream = CreatePngStream();
        var result = ImageValidator.Validate(stream, "image/png", ImageValidator.MaxFileSize);
        result.Should().Be(ImageValidationResult.Valid);
    }

    [Fact]
    public void Validate_OneByteOverLimit_ReturnsTooLarge()
    {
        using var stream = CreatePngStream();
        var result = ImageValidator.Validate(stream, "image/png", ImageValidator.MaxFileSize + 1);
        result.Should().Be(ImageValidationResult.TooLarge);
    }
}
