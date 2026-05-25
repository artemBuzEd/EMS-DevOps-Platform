using BLL.DTOs.Request.UserComment;
using FluentValidation;

namespace BLL.DTOs.Validation.CreateValidation;

public class UserCommentCreateValidation : AbstractValidator<UserCommentCreateRequestDTO>
{
    public UserCommentCreateValidation()
    {
        RuleFor(u => u.event_id).NotNull().NotEmpty().WithMessage("event id cannot be empty or null");
        RuleFor(u => u.comment).NotNull().NotEmpty().WithMessage("comment cannot be empty or null");
        RuleFor(u => u.rating).GreaterThanOrEqualTo(0).LessThanOrEqualTo(5).WithMessage("rating cannot be less than 0 and greater than 5 ");
    }
}