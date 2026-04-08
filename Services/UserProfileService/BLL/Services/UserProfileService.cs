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
        string cacheKey = $"userProfile_userId:{userId}";
        var userProfile = await _cache.GetOrCreateAsync(cacheKey, async token =>
        {
            var userProfiles = await _unitOfWork.UserProfileRepository.GetByIdAsync(userId);
            return userProfiles;
        },
            logger: _logger);
        
        //var userProfile = await _unitOfWork.UserProfileRepository.GetByIdAsync(userId);
        return userProfile.Adapt<UserProfileResponceDTO>();
    }

    public async Task<UserProfileResponceDTO> CreateAsync(UserProfileCreateRequestDTO dto, CancellationToken cancellationToken = default)
    {
        if (await _unitOfWork.UserProfileRepository.GetByIdAsync(dto.user_id) != null)
            throw new ValidationException("user with same id is already exist");
        
        var userProfileToCreate = dto.Adapt<UserProfile>();
        try
        {
            await _unitOfWork.BeginTransactionAsync(cancellationToken);
            await _unitOfWork.UserProfileRepository.CreateAsync(userProfileToCreate);
            await _unitOfWork.CompleteAsync(cancellationToken);
            await _unitOfWork.CommitTransactionAsync(cancellationToken);
            return userProfileToCreate.Adapt<UserProfileResponceDTO>();
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
        }
        catch (Exception ex)
        {
            await _unitOfWork.RollbackTransactionAsync(cancellationToken);
            throw new ApplicationException($"Error deleting userProfile with id: {userId} "+ex.Message);
        }
    }
    
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