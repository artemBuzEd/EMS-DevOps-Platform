using System.Reflection;
using Domain;
using Domain.Entities;
using Domain.ValueObjects;
using Infrastructure.DbContext;
using Microsoft.Extensions.DependencyInjection;
using MongoDB.Driver;

namespace EventCatalogApi.Seeding;

/// <summary>
/// Seeds a curated, deterministic set of demo events into MongoDB on startup.
///
/// This is the EventCatalog half of the cross-service demo dataset. The event
/// ids are PINNED (see <see cref="EventId"/>) so the UserProfile service can
/// attach comments/registrations to them without knowing Mongo-generated ids.
/// Keep the id formula and organizer subs below in sync with
/// UserProfileService/DAL/BogusSeed/DataSeeder.cs.
///
/// Guarded: if the events collection is non-empty the seeder is a no-op, so an
/// ordinary restart never duplicates data and only a wiped volume reseeds.
/// </summary>
public static class EventSeeder
{
    // Pinned Keycloak subs of the three organizers (see keycloak/realm-ems.json).
    private const string OrganizerUser = "22222222-2222-2222-2222-222222222222";
    private const string Olena         = "44444444-4444-4444-4444-444444444444";
    private const string Admin         = "11111111-1111-1111-1111-111111111111";

    // BaseEntity.Id has a protected setter; the demo needs fixed ids, so we set
    // it via reflection (same approach the in-memory test repository uses).
    private static readonly PropertyInfo IdProperty =
        typeof(BaseEntity).GetProperty("Id", BindingFlags.Instance | BindingFlags.Public)!;

    private const string ImgBase = "https://images.unsplash.com/photo-";
    private const string ImgQuery = "?auto=format&fit=crop&w=1200&q=80";

    private static string? Img(string? id) => id is null ? null : $"{ImgBase}{id}{ImgQuery}";

    // Deterministic 24-hex ObjectId for event index i (1..N): a fixed 22-char
    // prefix + the 2-digit hex index. Mirrored in the UserProfile seeder.
    public static string EventId(int index) => "6500000000000000000000" + index.ToString("x2");

    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        var context = serviceProvider.GetRequiredService<MongoDbContext>();

        var existing = await context.Events.CountDocumentsAsync(FilterDefinition<Event>.Empty);
        if (existing > 0)
        {
            Console.WriteLine($"EventSeeder: skipped, {existing} event(s) already present.");
            return;
        }

        var now = DateTime.UtcNow;
        var events = new List<Event>();

        foreach (var spec in Specs)
        {
            var start = now.AddDays(spec.StartOffsetDays);
            var end = start.AddDays(spec.DurationDays);

            var ev = new Event(
                spec.Title,
                spec.Description,
                new EventDateRange(start, end),
                new Location(spec.Address, spec.City, spec.Country),
                new EventCategory(spec.Category, CategoryDescriptions[spec.Category]),
                spec.OrganizerId,
                spec.VenueId,
                spec.Capacity);

            var picture = Img(spec.ImageId);
            if (picture is not null)
                ev.SetPictureUrl(picture);

            IdProperty.SetValue(ev, EventId(spec.Index));
            events.Add(ev);
        }

        await context.Events.InsertManyAsync(events);
        Console.WriteLine($"EventSeeder: inserted {events.Count} demo events.");
    }

    private static readonly Dictionary<string, string> CategoryDescriptions = new()
    {
        ["Music"]    = "Concerts, festivals and live music.",
        ["Sport"]    = "Matches, races and sporting events.",
        ["Theatre"]  = "Opera, ballet and stage performances.",
        ["Art"]      = "Exhibitions, expos and gallery shows.",
        ["Tech"]     = "Conferences, summits and meetups.",
        ["Business"] = "Forums, pitch days and networking.",
        ["Food"]     = "Food festivals and tasting events.",
        ["Comedy"]   = "Stand-up and improv comedy nights.",
    };

    private sealed record Spec(
        int Index,
        string Title,
        string Description,
        string Category,
        string VenueId,
        string Address,
        string City,
        string Country,
        int Capacity,
        string OrganizerId,
        int StartOffsetDays,
        int DurationDays,
        string? ImageId);

    // 20 curated events. Index 1-6 are in the past (ended), 7 is ongoing, 8-20
    // are upcoming — a convention the UserProfile seeder relies on to choose
    // registration statuses (Attended vs Registered/Interested). Venue details
    // (address/city/country/capacity) match the real venues in VenueDb by id.
    private static readonly Spec[] Specs =
    {
        new(1, "Vienna Philharmonic Gala",
            "An unforgettable evening with the Vienna Philharmonic performing classical masterpieces.",
            "Music", "1", "Volodymyrska St, 50", "Kyiv", "Ukraine", 1200, OrganizerUser, -60, 2,
            "1470229722913-7c0e2dbbafd3"),
        new(2, "Champions League Watch Party",
            "Watch the Champions League final on a giant screen with thousands of fans.",
            "Sport", "2", "Velyka Vasylkivska St, 55", "Kyiv", "Ukraine", 40000, Admin, -45, 1,
            "1522778119026-d647f0596c20"),
        new(3, "Lviv Jazz Nights",
            "Three nights of smooth jazz featuring local and international artists.",
            "Music", "8", "Viacheslava Chornovola Ave, 2", "Lviv", "Ukraine", 1300, Olena, -30, 3,
            "1540039155733-5bb30b53aa14"),
        new(4, "Modern Art Biennale",
            "A sweeping survey of contemporary Ukrainian and European visual art.",
            "Art", "17", "Sholom-Aleichema St, 4/26", "Dnipro", "Ukraine", 900, Olena, -21, 2,
            "1531913764164-f85c52e6e654"),
        new(5, "Stand-Up Comedy Night",
            "The country's sharpest comedians take the mic for one wild night.",
            "Comedy", "5", "Symona Petliury St, 4", "Kyiv", "Ukraine", 450, OrganizerUser, -14, 1,
            "1585699324551-f6c309eedeca"),
        new(6, "Carmen — Opera in Four Acts",
            "Bizet's beloved opera staged with a full orchestra and chorus.",
            "Theatre", "10", "Chaikovs'koho Ln, 1", "Odesa", "Ukraine", 1500, Olena, -8, 2,
            "1503095396549-807759245b35"),
        new(7, "DevConf Ukraine 2026",
            "The largest software engineering conference in the region, four days of talks and workshops.",
            "Tech", "15", "Akademika Pavlova St, 271", "Kharkiv", "Ukraine", 1800, Admin, -1, 4,
            "1505373877841-8d25f7d46678"),
        new(8, "Electronic Music Festival",
            "Two days of electronic music across four stages with headline DJs.",
            "Music", "9", "Staroznesenska St, 24-26", "Lviv", "Ukraine", 2400, OrganizerUser, 3, 2,
            "1501386761578-eac5c94b800a"),
        new(9, "Startup Pitch Day",
            "Early-stage founders pitch to investors and a live audience.",
            "Business", "24", "Pivnichnyi Blvd, 2a", "Ivano-Frankivsk", "Ukraine", 400, Olena, 7, 1,
            "1556761175-b413da4baf72"),
        new(10, "Premier League: Derby Match",
            "The biggest local derby of the season — expect a packed, roaring stadium.",
            "Sport", "14", "Plehanivska St, 65", "Kharkiv", "Ukraine", 35000, OrganizerUser, 10, 1,
            "1431324155629-1a6deb1dec8d"),
        new(11, "Taste of Odesa — Street Food Fest",
            "Dozens of food trucks and chefs serving street food by the sea.",
            "Food", "12", "Arcadia Beach", "Odesa", "Ukraine", 2500, OrganizerUser, 14, 2,
            "1414235077428-338989a2e8c0"),
        new(12, "Swan Lake — Classical Ballet",
            "Tchaikovsky's timeless ballet performed by the national ballet company.",
            "Theatre", "6", "Svobody Ave, 28", "Lviv", "Ukraine", 1000, Olena, 18, 1,
            "1507676184212-d03ab07a01bf"),
        new(13, "AI & Cloud Summit",
            "A full day on AI, cloud architecture and platform engineering.",
            "Tech", "3", "Sportyvna Square, 1", "Kyiv", "Ukraine", 3000, Admin, 25, 2,
            "1540575467063-178a50c2df87"),
        new(14, "Indie Rock Live",
            "An intimate night of indie rock with three rising bands.",
            "Music", "28", "Karbysheva St, 1", "Lutsk", "Ukraine", 1800, OrganizerUser, 32, 1,
            "1459749411175-04bf5292ceea"),
        new(15, "Contemporary Photography Expo",
            "A curated exhibition of contemporary photography from across Europe.",
            "Art", "30", "Myru St, 6", "Ternopil", "Ukraine", 800, Olena, 45, 3,
            "1545987796-200677ee1011"),
        new(16, "Marathon City Run 2026",
            "A full and half marathon through the historic city centre.",
            "Sport", "34", "Maidan Nezalezhnosti, 16", "Poltava", "Ukraine", 8000, OrganizerUser, 60, 1,
            "1540747913346-19e32dc3e97e"),
        new(17, "Wine & Jazz Evening",
            "Local wines paired with a live jazz trio in an elegant setting.",
            "Food", "42", "Shevchenka Blvd, 249", "Cherkasy", "Ukraine", 600, Olena, 75, 1,
            null),
        new(18, "Improv Comedy Battle",
            "Two improv troupes go head-to-head, judged by the crowd.",
            "Comedy", "22", "Peremohy Square, 1", "Vinnytsia", "Ukraine", 700, OrganizerUser, 90, 1,
            "1527224538127-2104bb71c51b"),
        new(19, "Business Leaders Forum",
            "Keynotes and panels with regional business leaders and founders.",
            "Business", "46", "Orlyna St, 13", "Uzhhorod", "Ukraine", 1200, Admin, 120, 2,
            "1511578314322-379afb476865"),
        new(20, "New Year Symphony Concert",
            "Ring in the new year with a festive symphony programme.",
            "Music", "13", "Sumska St, 25", "Kharkiv", "Ukraine", 1400, OrganizerUser, 160, 1,
            null),
    };
}
