using System.Security.Claims;
using BLL.DTOs.Request.UserComment;
using BLL.DTOs.Responce;
using BLL.Services.Contracts;
using DAL.Entities.HelpModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace WebApplication1.Controllers;

[Authorize]
[ApiController]
[Route("api/users/[controller]")]
public class UserCommentController : ControllerBase
{
    private readonly IUserCommentService _userCommentService;

    public UserCommentController(IUserCommentService userCommentService)
    {
        _userCommentService = userCommentService;
    }

    [AllowAnonymous]
    [HttpGet("ByEventId/{eventId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetAllByEventId(string eventId)
    {
        var comments = await _userCommentService.GetAllByEventId(eventId);
        return Ok(comments);
    }

    [AllowAnonymous]
    [HttpGet("ByUserId/{userId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetAllByUserId(string userId)
    {
        var comments = await _userCommentService.GetAllByUserId(userId);
        return Ok(comments);
    }

    [AllowAnonymous]
    [HttpGet("userInfoByComment/{commentId:int}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetUserInfoFromCommentId(int commentId)
    {
        var comment = await _userCommentService.GetUserInfoFromCommentId(commentId);
        return Ok(comment);
    }

    [AllowAnonymous]
    [HttpGet("{commentId:int}"), ActionName("GetByCommentId")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetByCommentId(int commentId)
    {
        var comment = await _userCommentService.GetById(commentId);
        return Ok(comment);
    }
    
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> CreateComment([FromBody] UserCommentCreateRequestDTO dto,
        CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var comment = await _userCommentService.CreateAsync(userId, dto, cancellationToken);
        return CreatedAtAction(nameof(GetByCommentId), new {commentId = comment.id}, comment);
    }
    
    [HttpPut("{commentId:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> UpdateComment(int commentId, [FromBody] UserCommentUpdateRequestDTO dto,
        CancellationToken cancellationToken)
    {
        await _userCommentService.UpdateAsync(commentId, dto, cancellationToken);
        return NoContent();
    }
    
    [HttpDelete("{commentId:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> DeleteComment(int commentId, CancellationToken cancellationToken)
    {
        await _userCommentService.DeleteAsync(commentId, cancellationToken);
        return NoContent();
    }

    [AllowAnonymous]
    [HttpGet("paginated")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetPaginated([FromQuery] UserCommentParameters parameters)
    {
        var result = await _userCommentService.GetAllPaginated(parameters);
        return Ok(result);
    }
}
