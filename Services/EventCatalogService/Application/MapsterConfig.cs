using System.Reflection;
using Application.DTOs;
using Domain.Entities;
using Domain.Helpers;
using Mapster;
using Microsoft.Extensions.DependencyInjection;

namespace Application;

public static class MapsterConfig
{
    public static void RegisterMapsterConfiguration(this IServiceCollection services)
    {
        TypeAdapterConfig<Event, EventMiniDto>
            .NewConfig()
            .Map(dest => dest.Id, src => src.Id)
            .Map(dest => dest.Title, src => src.Title)
            .Map(dest => dest.Description, src => src.Description)
            .Map(dest => dest.StartDate, src => src.DateRange.Start)
            .Map(dest => dest.EndDate, src => src.DateRange.End)
            .Map(dest => dest.FullLocation, src => $"{src.Location.Address}, {src.Location.City}, {src.Location.Country}")
            .Map(dest => dest.CategoryName, src => src.Category.Name)
            .Map(dest => dest.Capacity, src => src.Capacity)
            .Map(dest => dest.PictureUrl, src => src.PictureUrl);

        TypeAdapterConfig<Event, EventDto>
            .NewConfig()
            .Map(dest => dest.Id, src => src.Id)
            .Map(dest => dest.Title, src => src.Title)
            .Map(dest => dest.Description, src => src.Description)
            .Map(dest => dest.StartDate, src => src.DateRange.Start)
            .Map(dest => dest.EndDate, src => src.DateRange.End)
            .Map(dest => dest.FullLocation, src => $"{src.Location.Address}, {src.Location.City}, {src.Location.Country}")
            .Map(dest => dest.CategoryName, src => src.Category.Name)
            .Map(dest => dest.OrganizerId, src => src.OrganizerId)
            .Map(dest => dest.VenueId, src => src.VenueId)
            .Map(dest => dest.Capacity, src => src.Capacity)
            .Map(dest => dest.PictureUrl, src => src.PictureUrl);
        
        TypeAdapterConfig<PagedResult<Event>, PagedResult<EventMiniDto>>
            .NewConfig()
            .Map(dest => dest.Items, src => src.Items.Adapt<List<EventMiniDto>>())
            .Map(dest => dest.TotalCount, src => src.TotalCount)
            .Map(dest => dest.Page, src => src.Page)
            .Map(dest => dest.PageSize, src => src.PageSize);
        
        TypeAdapterConfig<PagedResult<Event>, PagedResult<EventDto>>
            .NewConfig()
            .Map(dest => dest.Items, src => src.Items.Adapt<List<EventDto>>())
            .Map(dest => dest.TotalCount, src => src.TotalCount)
            .Map(dest => dest.Page, src => src.Page)
            .Map(dest => dest.PageSize, src => src.PageSize);
    }
}