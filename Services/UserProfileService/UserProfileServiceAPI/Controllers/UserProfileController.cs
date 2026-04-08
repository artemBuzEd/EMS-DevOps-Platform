using BLL.DTOs.Request.UserProfile;
using BLL.Services.Contracts;
using DAL.Entities.HelpModels;
using Microsoft.AspNetCore.Mvc;

namespace WebApplication1.Controllers;
[ApiController]
[Route("api/users/[controller]")]
public class UserProfileController : ControllerBase
{
    private readonly IUserProfileService _userProfileService;

    public UserProfileController(IUserProfileService userProfileService)
    {
        _userProfileService = userProfileService;
    }

    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetAllUsers()
    {
        var profile = await _userProfileService.GetAllUsersAsync();
        return Ok(profile);
    }
    
    [HttpGet("{userId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetUserByUserId(string userId)
    {
        var user = await _userProfileService.GetUserByIdAsync(userId);
        return Ok(user);
    }
    
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> CreateUser([FromBody] UserProfileCreateRequestDTO dto,
        CancellationToken cancellationToken)
    {
        var user = await _userProfileService.CreateAsync(dto, cancellationToken);
        return CreatedAtAction(nameof(GetUserByUserId), new {userId = user.user_id}, user);
    }
    
    [HttpPut("{userId}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> UpdateUser(string userId, [FromBody] UserProfileUpdateRequestDTO dto,
        CancellationToken cancellationToken)
    {
        await _userProfileService.UpdateAsync(userId, dto, cancellationToken);
        return NoContent();
    }
    
    [HttpDelete("{userId}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> DeleteUser(string userId, CancellationToken cancellationToken)
    {
        await _userProfileService.DeleteAsync(userId, cancellationToken);
        return NoContent();
    }
    
    [HttpGet("paginated")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetPaginated([FromQuery] UserProfileParameters parameters)
    {
        var result = await _userProfileService.GetAllPaginated(parameters);
        return Ok(result);
    }
}