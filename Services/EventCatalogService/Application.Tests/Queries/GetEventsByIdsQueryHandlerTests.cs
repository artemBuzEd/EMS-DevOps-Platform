using Application.Events.Queries.GetEventsByIdsQuery;
using Domain.Entities;
using Domain.Interfaces;
using Domain.ValueObjects;
using FluentAssertions;
using Moq;

namespace Application.Tests.Queries;

public class GetEventsByIdsQueryHandlerTests
{
    private readonly Mock<IEventRepository> _repoMock;
    private readonly GetEventsByIdsQueryHandler _handler;

    public GetEventsByIdsQueryHandlerTests()
    {
        _repoMock = new Mock<IEventRepository>();
        _handler = new GetEventsByIdsQueryHandler(_repoMock.Object);
    }

    [Fact]
    public async Task Handle_EventsExist_ReturnsMatchingDtos()
    {
        var event1 = TestData.CreateEvent();
        var event2 = TestData.CreateEvent();
        var ids = new List<string> { event1.Id, event2.Id };

        _repoMock
            .Setup(r => r.GetByIdsAsync(ids))
            .ReturnsAsync(new List<Event> { event1, event2 });

        var query = new GetEventsByIdsQuery(ids);
        var result = (await _handler.Handle(query, CancellationToken.None)).ToList();

        result.Should().HaveCount(2);
        result.Should().Contain(e => e.Id == event1.Id);
        result.Should().Contain(e => e.Id == event2.Id);
    }

    [Fact]
    public async Task Handle_EmptyInput_ReturnsEmptyCollection()
    {
        var query = new GetEventsByIdsQuery(new List<string>());
        var result = await _handler.Handle(query, CancellationToken.None);

        result.Should().BeEmpty();
        _repoMock.Verify(r => r.GetByIdsAsync(It.IsAny<IEnumerable<string>>()), Times.Never);
    }

    [Fact]
    public async Task Handle_SomeIdsMissing_ReturnsOnlyFoundEvents()
    {
        var existingEvent = TestData.CreateEvent();
        var ids = new List<string> { existingEvent.Id, "nonexistent-id" };

        _repoMock
            .Setup(r => r.GetByIdsAsync(ids))
            .ReturnsAsync(new List<Event> { existingEvent });

        var query = new GetEventsByIdsQuery(ids);
        var result = (await _handler.Handle(query, CancellationToken.None)).ToList();

        result.Should().HaveCount(1);
        result.First().Id.Should().Be(existingEvent.Id);
    }
}
