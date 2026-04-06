using Application.Events.Commands.CreateEvent;
using Domain.Entities;
using Domain.Interfaces;
using FluentAssertions;
using Moq;

namespace Application.Tests.Commands;

public class CreateEventCommandHandlerTests
{
    private readonly Mock<IEventRepository> _repoMock;
    private readonly CreateEventCommandHandler _handler;

    public CreateEventCommandHandlerTests()
    {
        _repoMock = new Mock<IEventRepository>();
        _handler = new CreateEventCommandHandler(_repoMock.Object);
    }

    [Fact]
    public async Task Handle_ValidCommand_CallsAddAsync()
    {
        var command = TestData.CreateValidCommand();

        _repoMock
            .Setup(r => r.AddAsync(It.IsAny<Event>()))
            .Returns(Task.CompletedTask);
        
        var result = await _handler.Handle(command, CancellationToken.None);
        
        result.Should().BeNull();

        _repoMock.Verify(
            r => r.AddAsync(It.Is<Event>(e =>
                e.Title == command.Title &&
                e.Description == command.Description &&
                e.Capacity == command.Capacity
            )),
            Times.Once);
    }
}