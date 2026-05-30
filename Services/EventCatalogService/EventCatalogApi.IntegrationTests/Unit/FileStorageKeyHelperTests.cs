using Common.FileStorage;
using FluentAssertions;

namespace EventCatalogApi.IntegrationTests.Unit;

public class FileStorageKeyHelperTests
{
    [Theory]
    [InlineData("http://localhost/uploads/events/abc.png", "events/abc.png")]
    [InlineData("/uploads/events/abc.png", "events/abc.png")]
    [InlineData("http://api/Uploads/x.jpg", "x.jpg")]
    public void ExtractKey_ReturnsSubstringAfterSegment(string url, string expected)
    {
        FileStorageKeyHelper.ExtractKey(url).Should().Be(expected);
    }

    [Fact]
    public void ExtractKey_MissingSegment_ReturnsNull()
    {
        FileStorageKeyHelper.ExtractKey("http://localhost/files/abc.png").Should().BeNull();
    }

    [Fact]
    public void ExtractKey_EmptyInput_ReturnsNull()
    {
        FileStorageKeyHelper.ExtractKey("").Should().BeNull();
    }
}
