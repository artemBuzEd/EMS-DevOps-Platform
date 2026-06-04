using BLL.DTOs.Request.UserProfile;
using BLL.DTOs.Responce;
using BLL.Exceptions;
using BLL.Services.Contracts;
using Bogus;
using Common;
using DAL.Entities;
using DAL.Entities.HelpModels;
using DAL.Helpers;
using DAL.UoW;
using Mapster;
using MapsterMapper;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;
using Serilog;

namespace BLL.Services;

public class UserProfileService : IUserProfileService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IDistributedCache _cache;
    private readonly ILogger<UserProfileService> _logger;

    public UserProfileService(IUnitOfWork unitOfWork, IDistributedCache cache, ILogger<UserProfileService> logger)
    {
        _unitOfWork = unitOfWork;
        _cache = cache;
        _logger = logger;
    }
    
    public async Task<IEnumerable<UserProfileResponceDTO>> GetAllUsersAsync()
    {
        var userProfiles = await _unitOfWork.UserProfileRepository.GetAllAsync();
        return userProfiles.Adapt<IEnumerable<UserProfileResponceDTO>>();
    }

    public async Task<UserProfileResponceDTO> GetUserByIdAsync(string userId)
    {
        string cacheKey = ProfileCacheKey(userId);
        var userProfile = await _cache.GetOrCreateAsync(cacheKey, async token =>
        {
            var userProfiles = await _unitOfWork.UserProfileRepository.GetByIdAsync(userId);
            return userProfiles;
        },
            logger: _logger);
        
        if(userProfile is null)
            throw new NotFoundException($"User with id {userId} not found");
        
        return userProfile.Adapt<UserProfileResponceDTO>();
    }

    public async Task<bool> ExistsAsync(string userId)
    {
        string cacheKey = ProfileCacheKey(userId);
        var userProfile = await _cache.GetOrCreateAsync(cacheKey, async token =>
        {
            return await _unitOfWork.UserProfileRepository.GetByIdAsync(userId);
        }, logger: _logger);
        return userProfile is not null;
    }

    public async Task<UserProfileResponceDTO> CreateAsync(string userId, string firstName, string lastName, UserProfileCreateRequestDTO dto, CancellationToken cancellationToken = default)
    {
        if (await _unitOfWork.UserProfileRepository.GetByIdAsync(userId) != null)
            throw new ValidationException("user with same id is already exist");

        var userProfileToCreate = dto.Adapt<UserProfile>();
        userProfileToCreate.user_id = userId;
        userProfileToCreate.first_name = firstName;
        userProfileToCreate.last_name = lastName;
        try
        {
            await _unitOfWork.BeginTransactionAsync(cancellationToken);
            await _unitOfWork.UserProfileRepository.CreateAsync(userProfileToCreate);
            await _unitOfWork.CompleteAsync(cancellationToken);
            await _unitOfWork.CommitTransactionAsync(cancellationToken);
            return userProfileToCreate.Adapt<UserProfileResponceDTO>();
        }
        catch (ValidationException)
        {
            throw;
        }
        catch (Exception ex)
        {
            await _unitOfWork.RollbackTransactionAsync(cancellationToken);
            throw new ValidationException(ex.Message);
        }

    }

    public async Task UpdateAsync(string userId, UserProfileUpdateRequestDTO dto, CancellationToken cancellationToken = default)
    {
        try
        {
            var userProfileToChange = await isExists(userId);
            dto.Adapt(userProfileToChange);

            await _unitOfWork.BeginTransactionAsync(cancellationToken);
            await _unitOfWork.UserProfileRepository.UpdateAsync(userProfileToChange);
            await _unitOfWork.CompleteAsync(cancellationToken);
            await _unitOfWork.CommitTransactionAsync(cancellationToken);

            // Invalidate the cached profile so the next read returns the new values.
            await _cache.RemoveAsync(ProfileCacheKey(userId), cancellationToken);
        }
        catch (NotFoundException)
        {
            throw;
        }
        catch (Exception ex)
        {
            await _unitOfWork.RollbackTransactionAsync(cancellationToken);
            throw new ApplicationException($"Error updating userProfile with id: {userId} "+ex.Message);
        }
    }

    public async Task<PagedList<UserProfileResponceDTO>> GetAllPaginated(UserProfileParameters parameters)
    {
        var pagedList = await _unitOfWork.UserProfileRepository.GetAllPaginatedAsync(parameters, new SortHelper<UserProfile>());
        
        var mapped = pagedList.Select(p => p.Adapt<UserProfileResponceDTO>()).ToList();
        
        return new PagedList<UserProfileResponceDTO>(mapped, pagedList.TotalCount,pagedList.CurrentPage, pagedList.PageSize);
    }

    public async Task DeleteAsync(string userId, CancellationToken cancellationToken = default)
    {
        try
        {
            var userProfileToDelete = await isExists(userId);

            await _unitOfWork.BeginTransactionAsync(cancellationToken);
            await _unitOfWork.UserProfileRepository.DeleteAsync(userProfileToDelete);
            await _unitOfWork.CompleteAsync(cancellationToken);
            await _unitOfWork.CommitTransactionAsync(cancellationToken);
            
            await _cache.RemoveAsync(ProfileCacheKey(userId), cancellationToken);
        }
        catch (NotFoundException)
        {
            throw;
        }
        catch (Exception ex)
        {
            await _unitOfWork.RollbackTransactionAsync(cancellationToken);
            throw new ApplicationException($"Error deleting userProfile with id: {userId} "+ex.Message);
        }
    }
    
    public async Task UpdateAvatarUrlAsync(string userId, string? avatarUrl, CancellationToken cancellationToken = default)
    {
        try
        {
            var userProfile = await isExists(userId);
            userProfile.avatar_url = avatarUrl;

            await _unitOfWork.BeginTransactionAsync(cancellationToken);
            await _unitOfWork.UserProfileRepository.UpdateAsync(userProfile);
            await _unitOfWork.CompleteAsync(cancellationToken);
            await _unitOfWork.CommitTransactionAsync(cancellationToken);

            var cacheKey = ProfileCacheKey(userId);
            await _cache.RemoveAsync(cacheKey, cancellationToken);
        }
        catch (NotFoundException)
        {
            throw;
        }
        catch (Exception ex)
        {
            await _unitOfWork.RollbackTransactionAsync(cancellationToken);
            throw new ApplicationException($"Error updating avatar for user with id: {userId} " + ex.Message);
        }
    }

    // Single source for the profile cache key so every read and every write evict the
    // same entry. GetUserByIdAsync/ExistsAsync populate it; all mutations must clear it.
    private static string ProfileCacheKey(string userId) => $"userProfile_userId:{userId}";

    private async Task<UserProfile> isExists(string userId)
    {
        var _userProfile = await _unitOfWork.UserProfileRepository.GetByIdAsync(userId);
        if (_userProfile == null)
        {
            throw new NotFoundException($"User with id {userId} not found");
        }

        return _userProfile;
    }
}