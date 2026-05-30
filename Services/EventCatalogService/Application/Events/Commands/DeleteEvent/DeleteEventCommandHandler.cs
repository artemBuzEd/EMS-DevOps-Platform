using Application.Exceptions;
using Common.FileStorage;
using Domain.Interfaces;
using MediatR;

namespace Application.Events.Commands.DeleteEvent;

public class DeleteEventCommandHandler : IRequestHandler<DeleteEventCommand>
{
    private readonly IEventRepository _eventRepository;
    private readonly IFileStorage _fileStorage;

    public DeleteEventCommandHandler(IEventRepository eventRepository, IFileStorage fileStorage)
    {
        _eventRepository = eventRepository;
        _fileStorage = fileStorage;
    }

    public async Task Handle(DeleteEventCommand request, CancellationToken cancellationToken)
    {
        var eventToDelete = await _eventRepository.GetByIdAsync(request.Id);
        if (eventToDelete is null)
            throw new NotFoundException("Event", $"Event with id {request.Id} not found");

        if (!string.IsNullOrEmpty(eventToDelete.PictureUrl))
        {
            var key = FileStorageKeyHelper.ExtractKey(eventToDelete.PictureUrl);
            if (key != null)
                await _fileStorage.DeleteAsync(key, cancellationToken);
        }

        await _eventRepository.DeleteAsync(eventToDelete.Id);
    }
}
