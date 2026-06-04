using System.Security.Claims;
using BLL.DTOs.Request.UserProfile;
using BLL.Services.Contracts;
using Common.FileStorage;
using DAL.Entities.HelpModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace WebApplication1.Controllers;
[ApiController]
[Route("api/users/[controller]")]
public class UserProfileController : ControllerBase
{
    private readonly IUserProfileService _userProfileService;
    private readonly IFileStorage _fileStorage;

    public UserProfileController(IUserProfileService userProfileService, IFileStorage fileStorage)
    {
        _userProfileService = userProfileService;
        _fileStorage = fileStorage;
    }

    // The caller's own id, taken from the token — never from the route. Used to enforce
    // that an authenticated user can only act on their own profile (auth != ownership).
    private string? CurrentUserId => User.FindFirstValue(ClaimTypes.NameIdentifier);
    private bool IsAdmin => User.IsInRole("admin");

    [Authorize(Roles = "admin")]
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetAllUsers()
    {
        var profile = await _userProfileService.GetAllUsersAsync();
        return Ok(profile);
    }
    
    [Authorize]
    [HttpGet("{userId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetUserByUserId(string userId)
    {
        // Owner or admin only — a signed-in user can't read another user's profile by id.
        if (CurrentUserId != userId && !IsAdmin)
            return Forbid();

        var user = await _userProfileService.GetUserByIdAsync(userId);
        return Ok(user);
    }
    
    [Authorize]
    [HttpPut("{userId}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> UpdateUser(string userId, [FromBody] UserProfileUpdateRequestDTO dto,
        CancellationToken cancellationToken)
    {
        // Owner only — only the user himself may change his profile (admins do not edit here).
        if (CurrentUserId != userId)
            return Forbid();

        await _userProfileService.UpdateAsync(userId, dto, cancellationToken);
        return NoContent();
    }
    
    [Authorize(Roles = "admin")]
    [HttpDelete("{userId}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> DeleteUser(string userId, CancellationToken cancellationToken)
    {
        await _userProfileService.DeleteAsync(userId, cancellationToken);
        return NoContent();
    }
    
    [Authorize(Roles = "admin")]
    [HttpGet("paginated")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetPaginated([FromQuery] UserProfileParameters parameters)
    {
        var result = await _userProfileService.GetAllPaginated(parameters);
        return Ok(result);
    }

    [Authorize]
    [HttpPost("{userId}/avatar")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status413PayloadTooLarge)]
    [ProducesResponseType(StatusCodes.Status415UnsupportedMediaType)]
    public async Task<IActionResult> UploadAvatar(string userId, IFormFile file, CancellationToken cancellationToken)
    {
        // Owner only — only the user himself may upload his avatar.
        if (CurrentUserId != userId)
            return Forbid();

        if (!await _userProfileService.ExistsAsync(userId))
            return NotFound(new { message = $"User with id {userId} not found" });

        await using var stream = file.OpenReadStream();
        var result = ImageValidator.Validate(stream, file.ContentType, file.Length);

        switch (result)
        {
            case ImageValidationResult.TooLarge:
                return StatusCode(StatusCodes.Status413PayloadTooLarge,
                    new { message = "File size exceeds 5 MB limit." });
            case ImageValidationResult.UnsupportedType:
            case ImageValidationResult.InvalidMagicBytes:
                return StatusCode(StatusCodes.Status415UnsupportedMediaType,
                    new { message = "Only JPEG, PNG, and WebP images are allowed." });
        }

        stream.Position = 0;
        var ext = ImageValidator.GetExtension(file.ContentType);
        var fileName = $"avatars/{userId}-{Guid.NewGuid()}{ext}";

        var existingUser = await _userProfileService.GetUserByIdAsync(userId);
        if (!string.IsNullOrEmpty(existingUser.avatar_url))
        {
            var oldKey = ExtractKeyFromUrl(existingUser.avatar_url);
            if (oldKey != null)
                await _fileStorage.DeleteAsync(oldKey, cancellationToken);
        }

        var key = await _fileStorage.SaveAsync(stream, fileName, file.ContentType, cancellationToken);
        var imageUrl = _fileStorage.GetPublicUrl(key);
        await _userProfileService.UpdateAvatarUrlAsync(userId, imageUrl, cancellationToken);

        return Ok(new { imageUrl });
    }

    [Authorize]
    [HttpGet("{userId}/avatar")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetAvatar(string userId)
    {
        // Owner or admin only (kept for parity; the frontend reads avatar_url from the profile GET).
        if (CurrentUserId != userId && !IsAdmin)
            return Forbid();

        if (!await _userProfileService.ExistsAsync(userId))
            return NotFound(new { message = $"User with id {userId} not found" });

        var user = await _userProfileService.GetUserByIdAsync(userId);
        if (string.IsNullOrEmpty(user.avatar_url))
            return NotFound(new { message = "No avatar set for this user." });

        return Ok(new { imageUrl = user.avatar_url });
    }

    [Authorize]
    [HttpDelete("{userId}/avatar")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteAvatar(string userId, CancellationToken cancellationToken)
    {
        // Owner or admin — the user removes his own avatar; admins can remove anyone's (moderation).
        if (CurrentUserId != userId && !IsAdmin)
            return Forbid();

        if (!await _userProfileService.ExistsAsync(userId))
            return NotFound(new { message = $"User with id {userId} not found" });

        var user = await _userProfileService.GetUserByIdAsync(userId);
        if (!string.IsNullOrEmpty(user.avatar_url))
        {
            var oldKey = ExtractKeyFromUrl(user.avatar_url);
            if (oldKey != null)
                await _fileStorage.DeleteAsync(oldKey, cancellationToken);
            await _userProfileService.UpdateAvatarUrlAsync(userId, null, cancellationToken);
        }

        return NoContent();
    }

    private static string? ExtractKeyFromUrl(string url)
    {
        var uploadsIndex = url.IndexOf("/uploads/", StringComparison.OrdinalIgnoreCase);
        if (uploadsIndex < 0) return null;
        return url[(uploadsIndex + "/uploads/".Length)..];
    }
}