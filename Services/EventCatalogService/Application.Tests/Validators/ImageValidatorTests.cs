using Common.FileStorage;
using FluentAssertions;

namespace Application.Tests.Validators;

public class ImageValidatorTests
{
    [Fact]
    public void Validate_ValidPng_ReturnsValid()
    {
        var png = new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D };
        using var stream = new MemoryStream(png);
        var result = ImageValidator.Validate(stream, "image/png", stream.Length);
        result.Should().Be(ImageValidationResult.Valid);
    }

    [Fact]
    public void Validate_ExeClaimingPng_ReturnsInvalidMagicBytes()
    {
        var exe = new byte[] { 0x4D, 0x5A, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00 };
        using var stream = new MemoryStream(exe);
        var result = ImageValidator.Validate(stream, "image/png", stream.Length);
        result.Should().Be(ImageValidationResult.InvalidMagicBytes);
    }

    [Fact]
    public void Validate_TooLargeFile_ReturnsTooLarge()
    {
        var png = new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D };
        using var stream = new MemoryStream(png);
        var result = ImageValidator.Validate(stream, "image/png", 6 * 1024 * 1024);
        result.Should().Be(ImageValidationResult.TooLarge);
    }

    [Fact]
    public void Validate_UnsupportedType_ReturnsUnsupportedType()
    {
        var gif = new byte[] { 0x47, 0x49, 0x46, 0x38, 0x39, 0x61 };
        using var stream = new MemoryStream(gif);
        var result = ImageValidator.Validate(stream, "image/gif", stream.Length);
        result.Should().Be(ImageValidationResult.UnsupportedType);
    }
}
