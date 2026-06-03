using System.Security.Claims;
using BLL.DTOs.Request.UserEventCalendar;
using BLL.DTOs.Responce;
using BLL.Services.Contracts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace WebApplication1.Controllers;

[ApiController]
[Route("api/users/[controller]")]
public class UserEventCalendarController : ControllerBase
{
    private readonly IUserEventCalendarService _userEventCalendarService;

    public UserEventCalendarController(IUserEventCalendarService userEventCalendarService)
    {
        _userEventCalendarService = userEventCalendarService;
    }

    [AllowAnonymous]
    [HttpGet("ByUserId/{userId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetAllEventCalendarsByUserId(string userId)
    {
        var result = await _userEventCalendarService.GetAllByUserId(userId);
        return Ok(result);
    }

    [AllowAnonymous]
    [HttpGet("RegisteredByEventId/{eventId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public IActionResult GetAllRegisteredEventCalendarsByEventId(string eventId)
    {
        var result = _userEventCalendarService.GetAllRegisteredEventCalendarsByEventId(eventId);
        return Ok(result);
    }

    [AllowAnonymous]
    [HttpGet("UserInfoByEventId/{eventId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetAllUserInfoAndEventCalendarsByEventId(string eventId)
    {
        var result = await _userEventCalendarService.GetAllUserInfoAndEventCalendarByEventId(eventId);
        return Ok(result);
    }

    [AllowAnonymous]
    [HttpGet("ByRegistrationId/{registrationId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetEventCalendarsByRegistrationId(int registrationId)
    {
        var result = await _userEventCalendarService.GetAllEventCalendarsByRegistrationId(registrationId);
        return Ok(result);
    }

    [AllowAnonymous]
    [HttpGet("{calendarId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetEventCalendarById(int calendarId)
    {
        var result = await _userEventCalendarService.GetById(calendarId);
        return Ok(result);
    }

    [Authorize]
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CreateEventCalendar([FromBody] UserEventCalendarCreateRequestDTO dto,
        CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var calendars = await _userEventCalendarService.CreateAsync(userId, dto, cancellationToken);
        return CreatedAtAction(nameof(GetEventCalendarById), new { calendarId = calendars.id }, calendars);
    }

    [Authorize]
    [HttpDelete]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteEventCalendar(int calendarId, CancellationToken cancellationToken)
    {
        await _userEventCalendarService.DeleteAsync(calendarId, cancellationToken);
        return NoContent();
    }
}
