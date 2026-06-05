using BLL.DTOs.Responce;
using DAL.Entities;
using Mapster;

namespace BLL.Mapping;

// The UserEventCalendar entity exposes the registrant's profile through a nav
// property named `user`, but UserInfoAndEventCalendarResponceDTO exposes it as
// `profile`. Mapster matches members by name, so without this bridge `profile`
// is left as its empty default (all-null fields). The nested
// UserProfile -> UserProfileResponceDTO mapping still resolves by convention.
public class UserEventCalendarMappingRegister : IRegister
{
    public void Register(TypeAdapterConfig config)
    {
        config.NewConfig<UserEventCalendar, UserInfoAndEventCalendarResponceDTO>()
            .Map(dest => dest.profile, src => src.user);
    }
}
