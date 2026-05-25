using BLL.DTOs.Request.UserProfile;
using FluentValidation;

namespace BLL.DTOs.Validation.CreateValidation;

public class UserProfileCreateValidation : AbstractValidator<UserProfileCreateRequestDTO>
{
    public UserProfileCreateValidation()
    {
        RuleFor(u => u.birth_date).NotNull().NotEmpty().LessThanOrEqualTo(DateTime.UtcNow).WithMessage("Birth date cannot be empty or null");
    }
}