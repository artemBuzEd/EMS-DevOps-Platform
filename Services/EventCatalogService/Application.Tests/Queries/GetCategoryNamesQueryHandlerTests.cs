using Application.Events.Queries.GetCategoryNamesQuery;
using Domain.Interfaces;
using FluentAssertions;
using Moq;

namespace Application.Tests.Queries;

public class GetCategoryNamesQueryHandlerTests
{
    private readonly Mock<IEventRepository> _repoMock;
    private readonly GetCategoryNamesQueryHandler _handler;

    public GetCategoryNamesQueryHandlerTests()
    {
        _repoMock = new Mock<IEventRepository>();
        _handler = new GetCategoryNamesQueryHandler(_repoMock.Object);
    }

    [Fact]
    public async Task Handle_CategoriesExist_ReturnsNames()
    {
        var names = new List<string> { "Concerts", "Sports", "Workshops" };
        _repoMock
            .Setup(r => r.GetDistinctCategoryNamesAsync())
            .ReturnsAsync(names);

        var result = (await _handler.Handle(new GetCategoryNamesQuery(), CancellationToken.None)).ToList();

        result.Should().BeEquivalentTo(names);
    }

    [Fact]
    public async Task Handle_NoCategories_ReturnsEmptyCollection()
    {
        _repoMock
            .Setup(r => r.GetDistinctCategoryNamesAsync())
            .ReturnsAsync(new List<string>());

        var result = await _handler.Handle(new GetCategoryNamesQuery(), CancellationToken.None);

        result.Should().BeEmpty();
    }
}
