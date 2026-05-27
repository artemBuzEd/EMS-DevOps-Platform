using BLL.DTOs.Request.UserProfile;
using BLL.DTOs.Responce;
using DAL.Entities.HelpModels;
using DAL.Helpers;

namespace BLL.Services.Contracts;

public interface IUserProfileService
{
    Task<IEnumerable<UserProfileResponceDTO>> GetAllUsersAsync();
    Task<UserProfileResponceDTO> GetUserByIdAsync(string userId);
    Task<bool> ExistsAsync(string userId);
    Task<UserProfileResponceDTO> CreateAsync(string userId, string firstName, string lastName, UserProfileCreateRequestDTO dto, CancellationToken cancellationToken = default);
    Task UpdateAsync(string userId, UserProfileUpdateRequestDTO dto, CancellationToken cancellationToken = default);
    Task<PagedList<UserProfileResponceDTO>> GetAllPaginated(UserProfileParameters parameters);
    Task DeleteAsync(string userId, CancellationToken cancellationToken = default);
    Task UpdateAvatarUrlAsync(string userId, string? avatarUrl, CancellationToken cancellationToken = default);
}