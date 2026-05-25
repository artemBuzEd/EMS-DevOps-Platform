using System.ComponentModel.DataAnnotations;
using BLL.DTOs.Request.UserEventCalendar;
using BLL.DTOs.Responce;
using BLL.Exceptions;
using BLL.Services.Contracts;
using DAL.Entities;
using DAL.Entities.HelpModels;
using DAL.Helpers;
using DAL.Specification;
using DAL.UoW;
using Mapster;

namespace BLL.Services;

public class UserEventCalendarService : IUserEventCalendarService
{
    private readonly IUnitOfWork _unitOfWork;
    public UserEventCalendarService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }


    public async Task<IEnumerable<UserEventCalendarResponceDTO>> GetAllByUserId(string userId)
    {
        try
        {
            var allEventCalendars = await _unitOfWork.UserEventCalendarRepository.GetAllEventCalendarsByUserId(userId);
            return allEventCalendars.Adapt<IEnumerable<UserEventCalendarResponceDTO>>();
        }
        catch (Exception ex)
        {
            throw new ApplicationException("ERROR in GetAllByUserId UserEventCalendar service "+ex.Message);
        }
    }

    public IEnumerable<UserEventCalendarResponceDTO> GetAllRegisteredEventCalendarsByEventId(string eventId)
    {
        var spec = new RegisteredEventCalendarsSpecification(eventId);
        var allEventsCalendars = _unitOfWork.UserEventCalendarRepository.GetAllRegisteredEventCalendars(spec);
        return allEventsCalendars.Adapt<IEnumerable<UserEventCalendarResponceDTO>>();
    }

    public async Task<IEnumerable<UserInfoAndEventCalendarResponceDTO>> GetAllUserInfoAndEventCalendarByEventId(string eventId)
    {
        try
        {
            var allEventCalendars =
                await _unitOfWork.UserEventCalendarRepository.GetAllUserInfoAndEventCalendarsByEventId(eventId);
            return allEventCalendars.Adapt<IEnumerable<UserInfoAndEventCalendarResponceDTO>>();
        }
        catch (Exception ex)
        {
            throw new ApplicationException("ERROR in GetAllUserInfoAndEventCalendar service "+ex.Message);
        }
    }

    public async Task<IEnumerable<UserEventCalendarResponceDTO>> GetAllEventCalendarsByRegistrationId(int registrationId)
    {
        try
        {
            var allEventCalendars =
                await _unitOfWork.UserEventCalendarRepository.GetAllEventCalendarByRegistrationId(registrationId);
            return allEventCalendars.Adapt<IEnumerable<UserEventCalendarResponceDTO>>();
        }
        catch (Exception ex)
        {
            throw new ApplicationException("ERROR in GetAllEventCalendar service "+ex.Message);
        }
    }

    public async Task<UserEventCalendarResponceDTO> GetById(int calendarId)
    {
        try
        {
            var calendar = await _unitOfWork.UserEventCalendarRepository.GetByIdAsync(calendarId);
            if (calendar == null)
            {
                throw new NotFoundException($"Calendar with id {calendarId} not found");
            }

            return calendar.Adapt<UserEventCalendarResponceDTO>();
        }
        catch (Exception ex)
        {
            throw new ApplicationException("ERROR in GetById UserEventCalendar service "+ex.Message);
        }
    }

    public async Task<UserEventCalendarResponceDTO> CreateAsync(string userId, UserEventCalendarCreateRequestDTO dto, CancellationToken cancelationToken = default)
    {
        try
        {
            if (_unitOfWork.UserEventCalendarRepository.CheckForExistingCalendar(userId, dto.event_id))
            {
                throw new ValidationException("user calendar on event with same id's is already exists");
            }

            var eventCalendarToCreate = dto.Adapt<UserEventCalendar>();
            eventCalendarToCreate.user_id = userId;
            await _unitOfWork.BeginTransactionAsync(cancelationToken);
            await _unitOfWork.UserEventCalendarRepository.CreateAsync(eventCalendarToCreate);
            await _unitOfWork.CompleteAsync(cancelationToken);
            await _unitOfWork.CommitTransactionAsync(cancelationToken);
            return eventCalendarToCreate.Adapt<UserEventCalendarResponceDTO>();
        }
        catch (Exception ex)
        {
            await _unitOfWork.RollbackTransactionAsync(cancelationToken);
            throw new ApplicationException("ERROR in CreateAsync UserEventCalendar service "+ex.Message);
        }
    }

    public async Task<PagedList<UserEventCalendarResponceDTO>> GetAllPaginated(UserEventCalendarParameters parameters)
    {
        var pagedList = await _unitOfWork.UserEventCalendarRepository.GetAllPaginatedAsync(parameters, new SortHelper<UserEventCalendar>());
        
        var mapped = pagedList.Select(p => p.Adapt<UserEventCalendarResponceDTO>()).ToList();
        
        return new PagedList<UserEventCalendarResponceDTO>(mapped, pagedList.TotalCount, pagedList.CurrentPage, pagedList.PageSize);
    }

    public async Task DeleteAsync(int calendarId, CancellationToken cancelationToken = default)
    {
        try
        {
            var eventToDelete = await isExists(calendarId);
            await _unitOfWork.BeginTransactionAsync(cancelationToken);
            await _unitOfWork.UserEventCalendarRepository.DeleteAsync(eventToDelete);
            await _unitOfWork.CompleteAsync(cancelationToken);
            await _unitOfWork.CommitTransactionAsync(cancelationToken);
        }
        catch (Exception ex)
        {
            await _unitOfWork.RollbackTransactionAsync(cancelationToken);
            throw new ApplicationException("ERROR in DeleteAsync UserEventCalendar service "+ex.Message);
        }
    }

    private async Task<UserEventCalendar> isExists(int calendarId)
    {
        var _calendar = await _unitOfWork.UserEventCalendarRepository.GetByIdAsync(calendarId);
        if (_calendar == null)
        {
            throw new NotFoundException($"Event Calendar with id {calendarId} not found");
        }

        return _calendar;
    }
}