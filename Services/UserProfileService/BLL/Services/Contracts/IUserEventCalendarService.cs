using BLL.DTOs.Request.UserEventCalendar;
using BLL.DTOs.Responce;
using DAL.Entities;
using DAL.Entities.HelpModels;
using DAL.Helpers;

namespace BLL.Services.Contracts;

public interface IUserEventCalendarService
{
    Task<IEnumerable<UserEventCalendarResponceDTO>> GetAllByUserId(string userId);
    IEnumerable<UserEventCalendarResponceDTO> GetAllRegisteredEventCalendarsByEventId(string eventId);
    Task<IEnumerable<UserInfoAndEventCalendarResponceDTO>> GetAllUserInfoAndEventCalendarByEventId(string eventId);
    Task<IEnumerable<UserEventCalendarResponceDTO>> GetAllEventCalendarsByRegistrationId(int registrationId);
    Task<UserEventCalendarResponceDTO> GetById(int calendarId);
    Task<UserEventCalendarResponceDTO> CreateAsync(string userId, UserEventCalendarCreateRequestDTO dto, CancellationToken cancelationToken = default);
    Task<PagedList<UserEventCalendarResponceDTO>> GetAllPaginated(UserEventCalendarParameters parameters);
    Task DeleteAsync(int calendarId, CancellationToken cancelationToken = default);
}