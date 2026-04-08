using BLL.DTOs.Request.UserComment;
using BLL.DTOs.Responce;
using DAL.Entities.HelpModels;
using DAL.Helpers;

namespace BLL.Services.Contracts;

public interface IUserCommentService
{
    Task<IEnumerable<UserCommentResponceDTO>> GetAllByEventId(string eventId);
    Task<IEnumerable<UserCommentResponceDTO>> GetAllByUserId(string userId);
    Task<UserInfoFromCommentResponceDTO> GetUserInfoFromCommentId(int commentId);
    Task<UserCommentResponceDTO> GetById(int commentId);
    Task<UserCommentResponceDTO> CreateAsync(UserCommentCreateRequestDTO dto, CancellationToken cancellationToken = default);
    Task UpdateAsync(int commentId, UserCommentUpdateRequestDTO dto, CancellationToken cancellationToken = default);
    Task<PagedList<UserCommentResponceDTO>> GetAllPaginated(UserCommentParameters parameters);
    Task DeleteAsync(int commentId, CancellationToken cancellationToken = default);
}