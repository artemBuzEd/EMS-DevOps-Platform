using System.Data;
using BLL.DTOs.Request.UserEventCalendar;
using DAL.Entities;
using DAL.Entities.HelpModels.Enums;
using FluentValidation;

namespace BLL.DTOs.Validation.CreateValidation;

public class UserEventCalendarCreateValidation : AbstractValidator<UserEventCalendarCreateRequestDTO>
{
    public UserEventCalendarCreateValidation()
    {
        RuleFor(u => u.event_id).NotNull().NotEmpty().WithMessage("event id cannot be empty or null");
        RuleFor(u => u.status).IsEnumName(typeof(CalendarStatus), true).NotEmpty()
            .WithMessage("status cannot be empty or null, also might violate constraint rule");
    }
}