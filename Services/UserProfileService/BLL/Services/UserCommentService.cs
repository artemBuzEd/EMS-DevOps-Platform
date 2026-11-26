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
using Microsoft.Extensions.Logging;


namespace BLL.Services;

public class UserCommentService : IUserCommentService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IDistributedCache _cache;

    private readonly ILogger<UserCommentService> _logger;

    public UserCommentService(IUnitOfWork unitOfWork, IDistributedCache cache, ILogger<UserCommentService> logger)
    {
        _unitOfWork = unitOfWork;
        _cache = cache;
        _logger = logger;
    }
    
    public async Task<IEnumerable<UserCommentResponceDTO>> GetAllByEventId(string eventId)
    {
        var allComments = await _unitOfWork.UserCommentRepository.GetAllByEventId(eventId);
        return allComments.Adapt<IEnumerable<UserCommentResponceDTO>>();
    }

    public async Task<IEnumerable<UserCommentResponceDTO>> GetAllByUserId(string userId)
    {
        string cacheKey = AuthorCommentsCacheKey(userId);

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

    public async Task<UserCommentResponceDTO> CreateAsync(string userId, UserCommentCreateRequestDTO dto, CancellationToken cancellationToken = default)
    {
        var commentToCreate = dto.Adapt<UserComment>();
        commentToCreate.user_id = userId;
        try
        {
            await _unitOfWork.BeginTransactionAsync(cancellationToken);
            await _unitOfWork.UserCommentRepository.CreateAsync(commentToCreate);
            await _unitOfWork.CompleteAsync(cancellationToken);
            await _unitOfWork.CommitTransactionAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            await _unitOfWork.RollbackTransactionAsync(cancellationToken);
            throw new ApplicationException("Error creating user comment: " + ex.Message);
        }

        await InvalidateAuthorCommentsAsync(commentToCreate.user_id);
        return commentToCreate.Adapt<UserCommentResponceDTO>();
    }

    public async Task UpdateAsync(int commentId, string userId, UserCommentUpdateRequestDTO dto, CancellationToken cancellationToken = default)
    {
        var commentToUpdate = await GetExistingCommentAsync(commentId);
        if (commentToUpdate.user_id != userId)
            throw new ForbiddenException("Only the author can edit this comment.");

        dto.Adapt(commentToUpdate);
        try
        {
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

        await InvalidateAuthorCommentsAsync(commentToUpdate.user_id);
    }

    public async Task<PagedList<UserCommentResponceDTO>> GetAllPaginated(UserCommentParameters parameters)
    {
        var pagedList = await _unitOfWork.UserCommentRepository.GetAllPaginatedAsync(parameters, new SortHelper<UserComment>());
        
        var mapped = pagedList.Select(p => p.Adapt<UserCommentResponceDTO>()).ToList();
        
        return new PagedList<UserCommentResponceDTO>(mapped, pagedList.TotalCount,pagedList.CurrentPage, pagedList.PageSize);
    }

    public async Task DeleteAsync(int commentId, string userId, bool isAdmin, CancellationToken cancellationToken = default)
    {
        var commentToDelete = await GetExistingCommentAsync(commentId);
        if (commentToDelete.user_id != userId && !isAdmin)
            throw new ForbiddenException("Only the author or an admin can delete this comment.");

        try
        {
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

        await InvalidateAuthorCommentsAsync(commentToDelete.user_id);
    }
    
    private static string AuthorCommentsCacheKey(string authorId) => $"userComments_userId:{authorId}";

    private async Task InvalidateAuthorCommentsAsync(string authorId)
    {
        try
        {
            await _cache.RemoveAsync(AuthorCommentsCacheKey(authorId));
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not invalidate cached comments for author {AuthorId}", authorId);
        }
    }

    private async Task<UserComment> GetExistingCommentAsync(int commentId)
    {
        var comment = await _unitOfWork.UserCommentRepository.GetByIdAsync(commentId);
        if (comment == null)
        {
            throw new NotFoundException($"Comment with id {commentId} not found");
        }

        return comment;
    }
}
