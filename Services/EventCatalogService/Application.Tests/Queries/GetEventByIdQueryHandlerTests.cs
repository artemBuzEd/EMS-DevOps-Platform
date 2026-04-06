using Application.Events.Queries.GetEventByIdQuery;
using Application.Exceptions;
using Domain.Entities;
using Domain.Interfaces;
using FluentAssertions;
using Moq;

namespace Application.Tests.Queries;

public class GetEventByIdQueryHandlerTests
{
    private readonly Mock<IEventRepository> _repoMock;
    private readonly GetEventByIdQueryHandler _handler;

    public GetEventByIdQueryHandlerTests()
    {
        _repoMock = new Mock<IEventRepository>();
        _handler = new GetEventByIdQueryHandler(_repoMock.Object);
    }

    [Fact]
    public async Task Handle_EventExists_ReturnsEventDto()
    {
        
        var entity = TestData.CreateEvent();

        _repoMock
            .Setup(r => r.GetByIdAsync(entity.Id))
            .ReturnsAsync(entity);

        var query = new GetEventByIdQuery(entity.Id);
        
        var result = await _handler.Handle(query, CancellationToken.None);
        
        result.Should().NotBeNull();
        result.Id.Should().Be(entity.Id);
    }

    [Fact]
    public async Task Handle_EventNotFound_ThrowsNotFoundException()
    {
        _repoMock
            .Setup(r => r.GetByIdAsync(It.IsAny<string>()))
            .ReturnsAsync((Event?)null);

        var query = new GetEventByIdQuery("123");

     
        Func<Task> act = () => _handler.Handle(query, CancellationToken.None);

     
        await act.Should().ThrowAsync<NotFoundException>();
    }
}