using Bogus;
using DAL.BogusSeed.Fakers;
using DAL.Entities;
using DAL.EntityConfig;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace DAL.BogusSeed;

/// <summary>
/// Seeds the UserProfile half of the cross-service demo dataset: real (login-able)
/// profiles, a crowd of profile-only users, and comments + registrations that
/// point at the REAL events seeded by EventCatalog.
///
/// Determinism (so every machine rebuilds the same data):
///   - the 9 "real" profiles use the pinned Keycloak subs from keycloak/realm-ems.json;
///   - the 50 crowd profiles use a fixed Bogus seed;
///   - comments/registrations reference event ids via <see cref="EventId"/>, which
///     mirrors EventCatalog's EventSeeder.EventId formula.
///
/// Guarded: if any profile already exists the seeder is a no-op.
/// </summary>
public class DataSeeder
{
    // Pinned Keycloak subs (== UserProfile.user_id). Keep in sync with realm-ems.json.
    private const string Admin     = "11111111-1111-1111-1111-111111111111";
    private const string Organizer = "22222222-2222-2222-2222-222222222222";
    private const string Test      = "33333333-3333-3333-3333-333333333333";
    private const string Olena     = "44444444-4444-4444-4444-444444444444";
    private const string Dmytro    = "55555555-5555-5555-5555-555555555555";
    private const string Sofiia    = "66666666-6666-6666-6666-666666666666";
    private const string Andrii    = "77777777-7777-7777-7777-777777777777";
    private const string Kateryna  = "88888888-8888-8888-8888-888888888888";
    private const string Maksym    = "99999999-9999-9999-9999-999999999999";

    // Mirror of EventCatalog EventSeeder.EventId: fixed 22-char prefix + 2-digit
    // hex index. Events 1-6 are past (Attended), 7 is ongoing, 8-20 are upcoming.
    private static string EventId(int index) => "6500000000000000000000" + index.ToString("x2");
    private const int PastEventMax = 6;     // events 1..6 have already ended
    private const int OngoingEvent = 7;     // event 7 is happening now
    private const int EventCount   = 20;

    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        var context = serviceProvider.GetRequiredService<UserProfileDbContext>();

        await context.Database.EnsureCreatedAsync();

        if (context.UserProfiles.Any())
            return;

        Randomizer.Seed = new Random(12345);
        var faker = new Faker();

        // 1) Profiles: 9 pinned "real" users + 50 crowd. ---------------------------
        var realProfiles = new List<UserProfile>
        {
            RealProfile(Admin,     "Admin",    "User",       "Platform administrator."),
            RealProfile(Organizer, "Organizer","User",       "Event organizer and host."),
            RealProfile(Test,      "Test",     "User",       "Just here to explore great events."),
            RealProfile(Olena,     "Olena",    "Koval",      "Culture organizer. I run concerts and expos."),
            RealProfile(Dmytro,    "Dmytro",   "Shevchenko", "Sports fan and weekend runner."),
            RealProfile(Sofiia,    "Sofiia",   "Melnyk",     "Lover of theatre, ballet and live music."),
            RealProfile(Andrii,    "Andrii",   "Bondarenko", "Developer who never misses a tech conf."),
            RealProfile(Kateryna,  "Kateryna", "Tkachenko",  "Foodie and festival hopper."),
            RealProfile(Maksym,    "Maksym",   "Ivanenko",   "Always first in line for a good show."),
        };

        var crowd = new UserProfileFaker().Generate(50);

        var allProfiles = realProfiles.Concat(crowd).ToList();
        await context.UserProfiles.AddRangeAsync(allProfiles);
        await context.SaveChangesAsync();

        // Pool everyone can comment / register from.
        var pool = allProfiles.Select(p => p.user_id).ToList();

        // 2) Comments — reviews on past + ongoing events (1..7) only. --------------
        // Forced authors guarantee the named/test users show up where we demo them.
        var commentCounts = new[] { 11, 7, 12, 6, 8, 12, 14 }; // events 1..7
        var commentForced = new Dictionary<int, string[]>
        {
            [3] = new[] { Test, Dmytro },
            [5] = new[] { Sofiia },
            [6] = new[] { Test, Andrii },
            [7] = new[] { Kateryna, Maksym, Dmytro },
        };

        var comments = new List<UserComment>();
        for (var ev = 1; ev <= commentCounts.Length; ev++)
        {
            var authors = SampleDistinct(pool, commentCounts[ev - 1], faker,
                commentForced.GetValueOrDefault(ev));
            foreach (var userId in authors)
            {
                comments.Add(new UserComment
                {
                    user_id = userId,
                    event_id = EventId(ev),
                    comment = faker.PickRandom(ReviewTexts),
                    rating = faker.Random.WeightedRandom(
                        new[] { 2, 3, 4, 5 }, new[] { 0.08f, 0.17f, 0.40f, 0.35f }),
                    added_at = DateTime.UtcNow.AddDays(-faker.Random.Int(2, 40)),
                    is_changed = false,
                });
            }
        }

        await context.UserComments.AddRangeAsync(comments);
        await context.SaveChangesAsync();

        // 3) Registrations — every event; status follows the event's time bucket. --
        var regCounts = new[] { 7, 12, 8, 5, 5, 7, 10, 9, 4, 10, 8, 4, 7, 5, 3, 7, 3, 4, 4, 5 };
        var regForced = new Dictionary<int, string[]>
        {
            [2]  = new[] { Andrii },
            [3]  = new[] { Test },
            [6]  = new[] { Test },
            [7]  = new[] { Test },
            [8]  = new[] { Test, Sofiia },
            [10] = new[] { Dmytro, Kateryna },
            [11] = new[] { Test },
            [13] = new[] { Test, Maksym },
        };

        var registrations = new List<UserEventCalendar>();
        var registrationId = 100_001;
        for (var ev = 1; ev <= EventCount; ev++)
        {
            var attendees = SampleDistinct(pool, regCounts[ev - 1], faker,
                regForced.GetValueOrDefault(ev));
            foreach (var userId in attendees)
            {
                registrations.Add(new UserEventCalendar
                {
                    user_id = userId,
                    event_id = EventId(ev),
                    registration_id = registrationId++,
                    status = StatusFor(ev, faker),
                    added_at = DateTime.UtcNow.AddDays(-faker.Random.Int(0, 30)),
                });
            }
        }

        await context.UserEventCalendars.AddRangeAsync(registrations);
        await context.SaveChangesAsync();
    }

    private static UserProfile RealProfile(string id, string first, string last, string bio) => new()
    {
        user_id = id,
        first_name = first,
        last_name = last,
        bio = bio,
        birth_date = new DateTime(1990, 1, 1).AddDays((id[0] - '0') * 137),
        created_at = new DateTime(2025, 9, 1),
        avatar_url = null,
    };

    // "Registered"/"Interested" for upcoming, "Attended" for past, "Registered" for ongoing.
    private static string StatusFor(int eventIndex, Faker faker)
    {
        if (eventIndex <= PastEventMax) return "Attended";
        if (eventIndex == OngoingEvent) return "Registered";
        return faker.Random.WeightedRandom(
            new[] { "Registered", "Interested" }, new[] { 0.65f, 0.35f });
    }

    // Up to n distinct user ids, always including `forced` first.
    private static List<string> SampleDistinct(
        List<string> pool, int n, Faker faker, string[]? forced)
    {
        var chosen = new List<string>();
        var seen = new HashSet<string>();

        if (forced is not null)
            foreach (var id in forced)
                if (seen.Add(id)) chosen.Add(id);

        foreach (var id in faker.Random.Shuffle(pool))
        {
            if (chosen.Count >= n) break;
            if (seen.Add(id)) chosen.Add(id);
        }

        return chosen;
    }

    private static readonly string[] ReviewTexts =
    {
        "Absolutely loved it — would come again in a heartbeat!",
        "Great atmosphere and really well organised.",
        "Fantastic event, exceeded my expectations.",
        "The venue was perfect and the crowd was amazing.",
        "One of the best events I've been to this year.",
        "Well worth the ticket. Highly recommend.",
        "Brilliant from start to finish.",
        "Good event overall, though it started a little late.",
        "Solid lineup and a friendly crowd.",
        "Loved every minute, can't wait for the next one.",
        "Incredible energy in the room the whole night.",
        "Smoothly run and a lot of fun.",
        "A memorable evening — thank you to the organizers.",
        "Decent event, but parking was a nightmare.",
        "Top notch. The sound and lighting were superb.",
        "Really enjoyed it, brought friends and they loved it too.",
        "Great value and a beautiful venue.",
        "Had a wonderful time, everything ran on schedule.",
        "Impressive production quality.",
        "Fun, lively and welcoming. Five stars.",
        "Good vibes all around. Will be back.",
        "Exceeded expectations — such a warm atmosphere.",
        "A bit crowded for my taste, but still a great show.",
        "Wonderfully curated, every detail was thought through.",
        "The performers were outstanding.",
        "Easy to get to and well staffed.",
        "Pleasantly surprised by how good this was.",
        "An unforgettable night out.",
        "Could have used more food options, otherwise perfect.",
        "Highlight of my month, honestly.",
    };
}
