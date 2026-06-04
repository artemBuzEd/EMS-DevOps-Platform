// Mirrors the backend DTOs returned through the API Gateway.
// Casing matches the wire JSON exactly (System.Text.Json keeps C# property names).

// GET /api/aggregator/event-details/{id}  -> Aggregator EventDto
export interface AggregatedEvent {
  id: string;
  title: string;
  description: string;
  startDate: string; // ISO 8601
  endDate: string; // ISO 8601
  fullLocation: string;
  organizerId: string;
  venueId: number | null;
  capacity: number;
  pictureUrl: string | null;
}

export interface Venue {
  id: number;
  name: string;
  address: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  capacity: number | null;
}

// Nested author on a comment. Null when the commenter's profile can't be
// resolved (so rendering must fall back to a label derived from user_id).
export interface CommentUser {
  user_id: string;
  first_name: string;
  last_name: string;
}

export interface Comment {
  id: number;
  user_id: string;
  event_id: string;
  comment: string;
  rating: number;
  added_at: string; // ISO 8601
  is_changed: boolean;
  user: CommentUser | null;
}

// EventDetailsResponse (PascalCase top-level keys)
export interface EventDetails {
  event: AggregatedEvent;
  venue: Venue | null;
  comments: Comment[] | null;
  registeredUsersCount: number;
}

// GET /api/aggregator/event-details-with-organizer/{id} -> OrganizerDto
export interface Organizer {
  user_id: string;
  first_name: string;
  last_name: string;
}

export interface EventWithOrganizer {
  event: AggregatedEvent;
  organizer: Organizer | null;
}

// GET /api/events/{id} -> EventCatalog EventDto (only the field we still need)
export interface EventCatalogEvent {
  id: string;
  categoryName: string;
}

// Shape returned by every EventsController listing/search endpoint the public
// home page consumes:
//   GET /api/events                       -> PagedResult<EventMiniDto>
//   GET /api/events/upcoming              -> PagedResult<EventDto>
//   GET /api/events/searchText/{text}     -> EventMiniDto[]
//   GET /api/events/dateRange/{from}/{to} -> EventDto[]
// EventMiniDto was widened (Id/Description/CategoryName/Capacity added backend-side)
// so every endpoint yields the same fields — cards are uniform and all carry the
// id needed to link through to /events/{id}.
export interface EventListItem {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  fullLocation: string;
  categoryName: string;
  capacity: number;
  pictureUrl: string | null;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

// ── User dashboard ─────────────────────────────────────────────────────────
// GET /api/aggregator/user-dashboard/{userId} -> Aggregator UserDashboardResponse
//
// Casing matches the real wire JSON. The Aggregator serializes plain POCOs with
// ASP.NET's default camelCase policy, so PascalCase C# props arrive camelCased
// (EventTitle -> eventTitle). UserProfileDto's C# props are already snake_case,
// so they pass through unchanged.

// UserProfileDto (snake_case on the wire).
export interface UserProfile {
  user_id: string;
  first_name: string;
  last_name: string;
  bio: string;
  birth_date: string; // ISO 8601
}

// UserCalendarDto. eventTitle is null when the aggregator's gRPC enrichment
// fails; startDate/endDate come from DateTime? and may be null.
export interface UserCalendar {
  calendarId: number;
  userId: string;
  eventId: string;
  eventTitle: string | null;
  addedAt: string; // ISO 8601
  startDate: string | null; // ISO 8601
  endDate: string | null; // ISO 8601
  status: string;
}

// UserCommentDto. rating is `int` server-side today, but typed nullable so the
// UI degrades gracefully if the field is ever absent.
export interface UserComment {
  commentId: number;
  eventId: string;
  eventTitle: string | null;
  commentText: string;
  rating: number | null;
  createdAt: string; // ISO 8601
  isChanged: boolean;
}

export interface UserDashboardResponse {
  user: UserProfile;
  myCalendars: UserCalendar[];
  myComments: UserComment[];
}

// ── Edit Profile (/settings/profile) ─────────────────────────────────────────
// GET /api/users/UserProfile/{userId} -> UserProfileResponceDTO (snake_case wire).
// Note: `birth_date` is a non-nullable C# DateTime, so a never-set value arrives as
// the .NET default ("0001-01-01T00:00:00"), NOT JSON null — see isUnsetDate().
export interface UserProfileResponse {
  user_id: string;
  first_name: string;
  last_name: string;
  bio: string;
  birth_date: string; // ISO 8601
  created_at: string; // ISO 8601
  avatar_url: string | null;
}

// PUT /api/users/UserProfile/{userId} body -> UserProfileUpdateRequestDTO.
export interface UserProfileUpdateRequest {
  first_name: string;
  last_name: string;
  bio: string;
  birth_date: string; // ISO 8601
}

// POST /api/users/UserEventCalendar body -> UserEventCalendarCreateRequestDTO
// (snake_case wire). userId comes from the JWT, not the body. No real registration
// service exists, so registration_id is a non-unique random int generated client-side.
export interface CreateEventCalendarRequest {
  event_id: string;
  registration_id: number;
  status: "Registered" | "Pending";
}

// ── Create Event (/events/new) ───────────────────────────────────────────────
// POST /api/events body -> CreateEventRequest (camelCase wire; System.Text.Json
// lowercases the C# PascalCase props). City/Address/Country are derived from the
// selected venue on the client and sent silently — they are NOT form inputs.
// OrganizerId is NOT sent: the controller reads it from the JWT NameIdentifier claim.
export interface CreateEventRequest {
  title: string;
  description: string;
  startDate: string; // ISO 8601
  endDate: string; // ISO 8601
  city: string;
  address: string;
  country: string;
  categoryName: string;
  categoryDescription: string;
  venueId: string; // Venue.id (int) stringified — the DTO types VenueId as string
  capacity: number;
}
