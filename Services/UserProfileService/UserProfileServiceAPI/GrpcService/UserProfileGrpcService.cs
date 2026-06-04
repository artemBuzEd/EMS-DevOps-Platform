using BLL.Services.Contracts;
using DAL.UoW;
// Alias the entity: its unqualified name `UserProfile` collides with the
// proto-generated gRPC service class UserProfileApi.Protos.UserProfile.
using UserProfileEntity = DAL.Entities.UserProfile;
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

        var comments = (await _commentService.GetAllByEventId(request.EventId)).ToList();

        // Resolve commenter names in a single query — comments and profiles live
        // in this service's DB. A missing profile just leaves `user` unset.
        var userIds = comments.Select(c => c.user_id).Distinct().ToList();
        var profilesById = new Dictionary<string, UserProfileEntity>();
        if (userIds.Count > 0)
        {
            var profiles = await _unitOfWork.UserProfileRepository
                .FindByCondition(u => userIds.Contains(u.user_id));
            profilesById = profiles.ToDictionary(p => p.user_id);
        }

        var response = new EventCommentsResponse();
        response.Comments.AddRange(comments.Select(c =>
        {
            var dto = new EventCommentResponse
            {
                Id = c.id,
                UserId = c.user_id,
                EventId = c.event_id,
                Comment = c.comment,
                Rating = c.rating,
                AddedAt = Timestamp.FromDateTime(DateTime.SpecifyKind(c.added_at, DateTimeKind.Utc)),
                IsChanged = c.is_changed
            };

            if (profilesById.TryGetValue(c.user_id, out var profile))
            {
                dto.User = new CommentUser
                {
                    UserId = profile.user_id,
                    FirstName = profile.first_name ?? string.Empty,
                    LastName = profile.last_name ?? string.Empty
                };
            }

            return dto;
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
