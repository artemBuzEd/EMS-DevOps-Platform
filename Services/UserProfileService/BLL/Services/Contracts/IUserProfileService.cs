using BLL.DTOs.Request.UserProfile;
using BLL.DTOs.Responce;
using DAL.Entities.HelpModels;
using DAL.Helpers;

namespace BLL.Services.Contracts;

public interface IUserProfileService
{
    Task<IEnumerable<UserProfileResponceDTO>> GetAllUsersAsync();
    Task<UserProfileResponceDTO> GetUserByIdAsync(string userId);
    Task<UserProfileResponceDTO> CreateAsync(UserProfileCreateRequestDTO dto, CancellationToken cancellationToken = default);
    Task UpdateAsync(string userId, UserProfileUpdateRequestDTO dto, CancellationToken cancellationToken = default);
    Task<PagedList<UserProfileResponceDTO>> GetAllPaginated(UserProfileParameters parameters);
    Task DeleteAsync(string userId, CancellationToken cancellationToken = default);
}