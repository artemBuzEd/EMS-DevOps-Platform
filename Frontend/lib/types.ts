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

export interface Comment {
  id: number;
  user_id: string;
  event_id: string;
  comment: string;
  rating: number;
  added_at: string; // ISO 8601
  is_changed: boolean;
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

// GET /api/events/upcoming (paged list) -> PagedResult<EventDto>
// Uses the "upcoming" endpoint because the plain /api/events EventMiniDto omits id,
// and we need the id to link through to the details page.
export interface UpcomingEvent {
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
