using Application.Events.Commands.DeleteEvent;
using Application.Exceptions;
using Common.FileStorage;
using Domain.Entities;
using Domain.Interfaces;
using FluentAssertions;
using Moq;

namespace Application.Tests.Commands;

public class DeleteEventCommandHandlerTests
{
    private readonly Mock<IEventRepository> _repoMock;
    private readonly Mock<IFileStorage> _fileStorageMock;
    private readonly DeleteEventCommandHandler _handler;

    public DeleteEventCommandHandlerTests()
    {
        _repoMock = new Mock<IEventRepository>();
        _fileStorageMock = new Mock<IFileStorage>();
        _handler = new DeleteEventCommandHandler(_repoMock.Object, _fileStorageMock.Object);
    }

    [Fact]
    public async Task Handle_EventWithPicture_DeletesBlobBeforeEntity()
    {
        var entity = TestData.CreateEvent();
        entity.SetPictureUrl("http://localhost/uploads/events/abc-xyz.png");

        _repoMock.Setup(r => r.GetByIdAsync(entity.Id)).ReturnsAsync(entity);

        await _handler.Handle(new DeleteEventCommand(entity.Id), CancellationToken.None);

        _fileStorageMock.Verify(s => s.DeleteAsync("events/abc-xyz.png", It.IsAny<CancellationToken>()), Times.Once);
        _repoMock.Verify(r => r.DeleteAsync(entity.Id), Times.Once);
    }

    [Fact]
    public async Task Handle_EventWithoutPicture_SkipsBlobDelete()
    {
        var entity = TestData.CreateEvent();

        _repoMock.Setup(r => r.GetByIdAsync(entity.Id)).ReturnsAsync(entity);

        await _handler.Handle(new DeleteEventCommand(entity.Id), CancellationToken.None);

        _fileStorageMock.Verify(s => s.DeleteAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
        _repoMock.Verify(r => r.DeleteAsync(entity.Id), Times.Once);
    }

    [Fact]
    public async Task Handle_ExistingEvent_DeletesEvent()
    {
        
        var entity = TestData.CreateEvent();

        _repoMock
            .Setup(r => r.GetByIdAsync(entity.Id))
            .ReturnsAsync(entity);

        var command = new DeleteEventCommand(entity.Id);
        
        await _handler.Handle(command, CancellationToken.None);
        
        _repoMock.Verify(
            r => r.DeleteAsync(entity.Id),
            Times.Once);
    }

    [Fact]
    public async Task Handle_EventNotFound_ThrowsNotFoundException()
    {
        _repoMock
            .Setup(r => r.GetByIdAsync(It.IsAny<string>()))
            .ReturnsAsync((Event?)null);

        var command = new DeleteEventCommand("123");
        
        Func<Task> act = () => _handler.Handle(command, CancellationToken.None);
        
        await act.Should().ThrowAsync<NotFoundException>();

        _repoMock.Verify(
            r => r.DeleteAsync(It.IsAny<string>()),
            Times.Never);
    }
}