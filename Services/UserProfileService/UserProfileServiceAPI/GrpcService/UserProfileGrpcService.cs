using BLL.Services.Contracts;
using DAL.UoW;
using Google.Protobuf.WellKnownTypes;
using Grpc.Core;
using UserProfileApi.Protos;

namespace WebApplication1.GrpcService;

public class UserProfileGrpcService : UserProfile.UserProfileBase
{
    private readonly ILogger<UserProfileGrpcService> _logger;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IUserCommentService _commentService;
    private readonly IUserEventCalendarService _calendarService;

    public UserProfileGrpcService(
        ILogger<UserProfileGrpcService> logger,
        IUnitOfWork unitOfWork,
        IUserCommentService commentService,
        IUserEventCalendarService calendarService)
    {
        _logger = logger;
        _unitOfWork = unitOfWork;
        _commentService = commentService;
        _calendarService = calendarService;
    }

    public override async Task<UserResponse> GetUser(GetUserRequest request, ServerCallContext context)
    {
        _logger.LogInformation("gRPC GetUser request for user id: {UserId}", request.UserId);

        var userProfile = await _unitOfWork.UserProfileRepository.GetByIdAsync(request.UserId);

        if (userProfile is null)
            throw new RpcException(new Status(StatusCode.NotFound, $"User with id {request.UserId} does not exist."));

        return new UserResponse
        {
            UserId = userProfile.user_id,
            FirstName = userProfile.first_name,
            LastName = userProfile.last_name,
            Bio = userProfile.bio,
        };
    }

    public override async Task<EventCommentsResponse> GetEventComments(GetEventCommentsRequest request, ServerCallContext context)
    {
        _logger.LogInformation("gRPC GetEventComments for event: {EventId}", request.EventId);

        var comments = await _commentService.GetAllByEventId(request.EventId);

        var response = new EventCommentsResponse();
        response.Comments.AddRange(comments.Select(c => new EventCommentResponse
        {
            Id = c.id,
            UserId = c.user_id,
            EventId = c.event_id,
            Comment = c.comment,
            Rating = c.rating,
            AddedAt = Timestamp.FromDateTime(DateTime.SpecifyKind(c.added_at, DateTimeKind.Utc)),
            IsChanged = c.is_changed
        }));

        return response;
    }

    public override Task<RegisteredUsersCountResponse> GetRegisteredUsersCount(GetRegisteredUsersCountRequest request, ServerCallContext context)
    {
        _logger.LogInformation("gRPC GetRegisteredUsersCount for event: {EventId}", request.EventId);

        var registrations = _calendarService.GetAllRegisteredEventCalendarsByEventId(request.EventId);
        var count = registrations.Count();

        return Task.FromResult(new RegisteredUsersCountResponse { Count = count });
    }
}
