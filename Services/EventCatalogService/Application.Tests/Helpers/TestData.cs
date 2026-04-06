using Application.Events.Commands.CreateEvent;
using Domain.Entities;
using Domain.ValueObjects;

public static class TestData
{
    public static CreateEventCommand CreateValidCommand()
    {
        return new CreateEventCommand(
            "Test Event",
            "This is a test event description",
            new EventDateRange(DateTime.UtcNow, DateTime.UtcNow.AddDays(1)),
            new Location("Main street 1", "Kyiv", "Ukraine"),
            "Conference",
            "Tech conference",
            "organizer-id",
            "venue-id",
            100
        );
    }

    public static Event CreateEvent()
    {
        return new Event(
            "Test",
            "Description",
            new EventDateRange(DateTime.UtcNow, DateTime.UtcNow.AddDays(1)),
            new Location("Street", "City", "Country"),
            new EventCategory("Category", "Desc"),
            "org",
            "venue",
            50
        );
    }
}