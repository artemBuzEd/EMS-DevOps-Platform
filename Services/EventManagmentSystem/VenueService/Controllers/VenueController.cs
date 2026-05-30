using EMS.DAL.ADO.NET.Entities;
using EMS.DAL.ADO.NET.Repositories.Contracts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace VenueService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class VenueController : ControllerBase
{
    private readonly IUOW _uow;
    private ILogger<VenueController> _logger;

    public VenueController(IUOW uow, ILogger<VenueController> logger)
    {
        _uow = uow;
        _logger = logger;
    }
    
    [AllowAnonymous]
    [HttpGet("GetAllVenues")]
    public async Task<ActionResult<IEnumerable<Venue>>> GetAllVenues()
    {
        try
        {
            var result = await _uow.VenueRepository.GetAllAsync();
            _uow.Commit();
            _logger.LogInformation("Returned all venues.");
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex.Message + "Transaction FAILED! Something went wrong in GetAllVenues()");
            return StatusCode(500);
        }
    }
    
    
    [AllowAnonymous]
    [HttpGet("GetVenuesById/{id:int}", Name = "GetVenuesById")]
    public async Task<ActionResult<Venue>> GetVenuesByIdAsync(int id)
    {
        try
        {
            var result = await _uow.VenueRepository.GetByIdAsync(id);
            _uow.Commit();
            if (result == null)
            {
                _logger.LogInformation($"Returned null venue. Venue not found with id {id}");
                return NotFound();
            }
            _logger.LogInformation($"Returned Venue with id {id}");
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex.Message + "Venue Transaction FAILED! in GetVenuesByIdAsync(id)");
            return StatusCode(500);
        }
    }
    
    [Authorize(Roles = "organizer,admin")]
    [HttpPost("PostVenue")]
    public async Task<ActionResult> PostVenueAsync([FromBody] Venue @venue)
    {
        try
        {
            if (@venue == null)
            {
                _logger.LogError("Venue object sent from client is null");
                return BadRequest("Venue object sent from client is null");
            }

            if (!ModelState.IsValid)
            {
                _logger.LogError("venue object sent from client is invalid");
                return BadRequest("venue object sent from client is invalid");
            }

            var created_id = await _uow.VenueRepository.AddAsync(@venue);
            var createdVenue = await _uow.VenueRepository.GetByIdAsync(created_id);
            _uow.Commit();
            return CreatedAtRoute("GetVenuesById", new { id = createdVenue.id }, createdVenue);
        }
        catch (Exception ex)
        {
            _logger.LogError($"FAILED POST Venue in PostVenueAsync(): {ex.Message}");
            return StatusCode(500);
        }
    }

    [AllowAnonymous]
    [HttpGet("GetVenueByCity/{city}/")]
    public async Task<ActionResult<IEnumerable<Venue>>> GetVenueByCityAsync(string city)
    {
        try
        {
            var result = await _uow.VenueRepository.GetByCityAsync(city);
            _uow.Commit();
            if (result == null)
            {
                _logger.LogInformation($"Returned null venues. Venue not found with city {city}");
                return NotFound();
            }
            else
            {
                _logger.LogInformation($"Returned Venue with city {city}");
                return Ok(result);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError($"FAILED GET GetVenueByCityAsync(): {ex.Message}");
            return StatusCode(500);
        }
    }
    
    [Authorize(Roles = "admin")]
    [HttpDelete("Delete/{id}")]
    public async Task<ActionResult> DeleteAsync(int id)
    {
        try
        {
            var venueEntity = await _uow.VenueRepository.GetByIdAsync(id);
            if (venueEntity == null)
            {
                _logger.LogError($"Venue object with {id} was not found in the database");
                return NotFound($"Venue object with {id} was not found in the database");
            }

            await _uow.VenueRepository.DeleteAsync(id);
            _uow.Commit();
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError($"FAILED DELETE Venue in DeleteAsync(): {ex.Message}");
            return StatusCode(500);
        }
    }
}