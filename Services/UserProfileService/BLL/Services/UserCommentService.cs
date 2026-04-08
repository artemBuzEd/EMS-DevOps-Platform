using BLL.DTOs.Request.UserComment;
using BLL.DTOs.Responce;
using BLL.Exceptions;
using BLL.Services.Contracts;
using Common;
using DAL.Entities;
using DAL.Entities.HelpModels;
using DAL.Helpers;
using DAL.UoW;
using Mapster;
using Microsoft.Extensions.Caching.Distributed;


namespace BLL.Services;

public class UserCommentService : IUserCommentService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IDistributedCache _cache;

    public UserCommentService(IUnitOfWork unitOfWork, IDistributedCache cache)
    {
        _unitOfWork = unitOfWork;
        _cache = cache;
    }
    
    public async Task<IEnumerable<UserCommentResponceDTO>> GetAllByEventId(string eventId)
    {
        var allComments = await _unitOfWork.UserCommentRepository.GetAllByEventId(eventId);
        return allComments.Adapt<IEnumerable<UserCommentResponceDTO>>();
    }

    public async Task<IEnumerable<UserCommentResponceDTO>> GetAllByUserId(string userId)
    {
        string cacheKey = $"userComments_userId:{userId}";

        var allComments = await _cache.GetOrCreateAsync(cacheKey, async token =>
        {
            var comments = await _unitOfWork.UserCommentRepository.GetAllByUserId(userId);
            return comments;
        });
        
        return allComments.Adapt<IEnumerable<UserCommentResponceDTO>>();
    }

    public async Task<UserInfoFromCommentResponceDTO> GetUserInfoFromCommentId(int commentId)
    {
        var userInfoAndComment = await _unitOfWork.UserCommentRepository.GetUserInfoByCommentId(commentId);
        return userInfoAndComment.Adapt<UserInfoFromCommentResponceDTO>();
    }

    public async Task<UserCommentResponceDTO> GetById(int commentId)
    {
        var comment = await _unitOfWork.UserCommentRepository.GetByIdAsync(commentId);
        return comment.Adapt<UserCommentResponceDTO>();
    }

    public async Task<UserCommentResponceDTO> CreateAsync(UserCommentCreateRequestDTO dto, CancellationToken cancellationToken = default)
    {
        var commentToCreate = dto.Adapt<UserComment>();
        try
        {
            await _unitOfWork.BeginTransactionAsync(cancellationToken);
            await _unitOfWork.UserCommentRepository.CreateAsync(commentToCreate);
            await _unitOfWork.CompleteAsync(cancellationToken);
            await _unitOfWork.CommitTransactionAsync(cancellationToken);
            return commentToCreate.Adapt<UserCommentResponceDTO>();
        }
        catch (Exception ex)
        {
            await _unitOfWork.RollbackTransactionAsync(cancellationToken);
            throw new ApplicationException("Error creating user comment: " + ex.Message);
        }
    }

    public async Task UpdateAsync(int commentId, UserCommentUpdateRequestDTO dto, CancellationToken cancellationToken = default)
    {
        try
        {
            var commentToUpdate = await isExists(commentId);
            dto.Adapt(commentToUpdate);
            
            await _unitOfWork.BeginTransactionAsync(cancellationToken);
            await _unitOfWork.UserCommentRepository.UpdateAsync(commentToUpdate);
            await _unitOfWork.CompleteAsync(cancellationToken);
            await _unitOfWork.CommitTransactionAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            await _unitOfWork.RollbackTransactionAsync(cancellationToken);
            throw new ApplicationException("Error updating user comment: " + ex.Message);
        }
    }

    public async Task<PagedList<UserCommentResponceDTO>> GetAllPaginated(UserCommentParameters parameters)
    {
        var pagedList = await _unitOfWork.UserCommentRepository.GetAllPaginatedAsync(parameters, new SortHelper<UserComment>());
        
        var mapped = pagedList.Select(p => p.Adapt<UserCommentResponceDTO>()).ToList();
        
        return new PagedList<UserCommentResponceDTO>(mapped, pagedList.TotalCount,pagedList.CurrentPage, pagedList.PageSize);
    }

    public async Task DeleteAsync(int commentId, CancellationToken cancellationToken = default)
    {
        try
        {
            var commentToDelete = await isExists(commentId);
            await _unitOfWork.BeginTransactionAsync(cancellationToken);
            await _unitOfWork.UserCommentRepository.DeleteAsync(commentToDelete);
            await _unitOfWork.CompleteAsync(cancellationToken);
            await _unitOfWork.CommitTransactionAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            await _unitOfWork.RollbackTransactionAsync(cancellationToken);
            throw new ApplicationException("Error deleting user comment: " + ex.Message);
        }
    }
    
    private async Task<UserComment> isExists(int commentId)
    {
        var _comment = await _unitOfWork.UserCommentRepository.GetByIdAsync(commentId);
        if (_comment == null)
        {
            throw new NotFoundException($"Comment with id {commentId} not found");
        }

        return _comment;
    }
}