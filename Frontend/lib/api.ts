import type {
  Comment,
  CreateEventCalendarRequest,
  CreateEventRequest,
  EventCatalogEvent,
  EventDetails,
  EventListItem,
  EventWithOrganizer,
  Organizer,
  PagedResult,
  UserDashboardResponse,
  UserProfileResponse,
  UserProfileUpdateRequest,
  Venue,
} from "./types";
import { authedFetch } from "./auth/authedFetch";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000";

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    signal,
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new ApiError(res.status, `GET ${path} failed (${res.status})`);
  }
  return (await res.json()) as T;
}

// Primary call: event + venue + comments + registered count.
export function getEventDetails(
  id: string,
  signal?: AbortSignal,
): Promise<EventDetails> {
  return getJson<EventDetails>(
    `/api/aggregator/event-details/${encodeURIComponent(id)}`,
    signal,
  );
}

// Secondary (fail-soft): organizer name.
export async function getOrganizer(
  id: string,
  signal?: AbortSignal,
): Promise<Organizer | null> {
  try {
    const data = await getJson<EventWithOrganizer>(
      `/api/aggregator/event-details-with-organizer/${encodeURIComponent(id)}`,
      signal,
    );
    return data.organizer ?? null;
  } catch {
    return null;
  }
}

// Secondary (fail-soft): category name for the chip.
export async function getCategory(
  id: string,
  signal?: AbortSignal,
): Promise<string | null> {
  try {
    const data = await getJson<EventCatalogEvent>(
      `/api/events/${encodeURIComponent(id)}`,
      signal,
    );
    return data.categoryName ?? null;
  } catch {
    return null;
  }
}

// ── Public event listing (home page `/`) ────────────────────────────────────
// All token-free via getJson — the page is public, so we deliberately do NOT go
// through authedFetch (no Authorization header is sent for anonymous visitors).
//
// Caching: a tiny time-boxed in-memory cache keyed by the full request path.
// The app uses plain fetch (not React Query/SWR), so we keep that pattern and
// implement just enough caching to satisfy "no re-fetch on tab refocus unless
// stale (>5 min)". A repeated identical request within the TTL returns the
// cached value instead of hitting the network; nothing re-fetches on focus
// because we never attach a focus listener.
const LIST_TTL_MS = 5 * 60 * 1000;
const listCache = new Map<string, { ts: number; data: unknown }>();

async function getListJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const hit = listCache.get(path);
  if (hit && Date.now() - hit.ts < LIST_TTL_MS) {
    return hit.data as T;
  }
  const data = await getJson<T>(path, signal);
  listCache.set(path, { ts: Date.now(), data });
  return data;
}

// Default landing: paginated list. EventMiniDto (widened backend-side to carry id).
export function getEvents(
  pageNumber: number,
  pageSize: number,
  signal?: AbortSignal,
): Promise<PagedResult<EventListItem>> {
  return getListJson<PagedResult<EventListItem>>(
    `/api/events?pageNumber=${pageNumber}&pageSize=${pageSize}`,
    signal,
  );
}

// "Upcoming only" toggle: paginated list of events that haven't started yet.
export function getUpcomingEvents(
  pageNumber: number,
  pageSize: number,
  signal?: AbortSignal,
): Promise<PagedResult<EventListItem>> {
  return getListJson<PagedResult<EventListItem>>(
    `/api/events/upcoming?pageNumber=${pageNumber}&pageSize=${pageSize}`,
    signal,
  );
}

// Text search. Returns a full (non-paged) list — no pageNumber/pageSize accepted.
export function searchEvents(
  text: string,
  signal?: AbortSignal,
): Promise<EventListItem[]> {
  return getListJson<EventListItem[]>(
    `/api/events/searchText/${encodeURIComponent(text)}`,
    signal,
  );
}

// Date range. Returns a full (non-paged) list. Dates are ISO strings; the route
// binds them to DateTime server-side.
export function getEventsByDateRange(
  fromIso: string,
  toIso: string,
  signal?: AbortSignal,
): Promise<EventListItem[]> {
  return getListJson<EventListItem[]>(
    `/api/events/dateRange/${encodeURIComponent(fromIso)}/${encodeURIComponent(toIso)}`,
    signal,
  );
}

// ── User dashboard ─────────────────────────────────────────────────────────
// The dashboard always belongs to the signed-in user: the aggregator derives
// the user from the access token (`sub`), so no id is sent from here. Cached
// for the lifetime of the tab so navigating away and back doesn't re-hit the
// aggregator — a single value since there's only ever the current user.
let dashboardCache: UserDashboardResponse | undefined;

// Primary call: profile + joined-event calendars + comment activity. Goes
// through authedFetch, which attaches the bearer token, refreshes it before
// expiry, and retries once on a 401.
export async function getUserDashboard(
  signal?: AbortSignal,
): Promise<UserDashboardResponse> {
  if (dashboardCache) return dashboardCache;

  const res = await authedFetch(`${BASE_URL}/api/aggregator/user-dashboard`, {
    signal,
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new ApiError(
      res.status,
      `GET user-dashboard failed (${res.status})`,
    );
  }
  const data = (await res.json()) as UserDashboardResponse;
  dashboardCache = data;
  return data;
}

// ── Edit Profile (/settings/profile) ─────────────────────────────────────────
// The page always edits the *current* user — the caller passes the id from
// keycloak.tokenParsed.sub. The backend additionally enforces that this id matches
// the token claim, so a tampered id is rejected server-side (403). No caching here:
// edits must always reflect the latest server state.
const PROFILE_BASE = `${BASE_URL}/api/users/UserProfile`;

export async function getUserProfile(
  userId: string,
  signal?: AbortSignal,
): Promise<UserProfileResponse> {
  const res = await authedFetch(`${PROFILE_BASE}/${encodeURIComponent(userId)}`, {
    signal,
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new ApiError(res.status, `GET UserProfile failed (${res.status})`);
  }
  return (await res.json()) as UserProfileResponse;
}

export async function updateUserProfile(
  userId: string,
  body: UserProfileUpdateRequest,
  signal?: AbortSignal,
): Promise<void> {
  const res = await authedFetch(`${PROFILE_BASE}/${encodeURIComponent(userId)}`, {
    method: "PUT",
    signal,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new ApiError(res.status, `PUT UserProfile failed (${res.status})`);
  }
}

// multipart/form-data, field name `file` (per backend). Returns the stored image URL.
export async function uploadAvatar(
  userId: string,
  file: File,
  signal?: AbortSignal,
): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  // Note: do NOT set Content-Type — the browser sets the multipart boundary itself.
  const res = await authedFetch(`${PROFILE_BASE}/${encodeURIComponent(userId)}/avatar`, {
    method: "POST",
    signal,
    body: form,
  });
  if (!res.ok) {
    throw new ApiError(res.status, `POST avatar failed (${res.status})`);
  }
  const data = (await res.json()) as { imageUrl: string };
  return data.imageUrl;
}

export async function deleteAvatar(
  userId: string,
  signal?: AbortSignal,
): Promise<void> {
  const res = await authedFetch(`${PROFILE_BASE}/${encodeURIComponent(userId)}/avatar`, {
    method: "DELETE",
    signal,
  });
  if (!res.ok) {
    throw new ApiError(res.status, `DELETE avatar failed (${res.status})`);
  }
}

// ── Create Event (/events/new) ───────────────────────────────────────────────
// Both lookups are public read endpoints ([AllowAnonymous] server-side), so they
// use the token-free getJson — no Authorization header needed to populate the form.

// GET /api/events/categories -> string[] (distinct category names only; the
// endpoint does NOT return descriptions — see createEvent's categoryDescription).
export function getCategories(signal?: AbortSignal): Promise<string[]> {
  return getJson<string[]>("/api/events/categories", signal);
}

// GET /api/venues/GetAllVenues -> Venue[] (no backend pagination; the page
// paginates on the client). The gateway rewrites /api/venues -> /api/Venue, so
// the browser-facing path is the lowercase `venues` form.
export function getAllVenues(signal?: AbortSignal): Promise<Venue[]> {
  return getJson<Venue[]>("/api/venues/GetAllVenues", signal);
}

// POST /api/events -> 201 { id }. Requires the CanCreateEvent policy, so it goes
// through authedFetch (bearer token, refresh, 401 retry). On 400 the backend
// returns { message }; surface it so the form can show "Server rejected: …".
export async function createEvent(
  body: CreateEventRequest,
  signal?: AbortSignal,
): Promise<string> {
  const res = await authedFetch(`${BASE_URL}/api/events`, {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let message = `POST /api/events failed (${res.status})`;
    if (res.status === 400) {
      try {
        const data = (await res.json()) as { message?: string };
        if (data?.message) message = data.message;
      } catch {
        // non-JSON body — keep the generic message
      }
    }
    throw new ApiError(res.status, message);
  }
  const data = (await res.json()) as { id: string };
  return data.id;
}

// POST /api/events/{id}/picture (multipart, field `file`, <=6MB). Runs as phase 2
// after createEvent. Do NOT set Content-Type — the browser sets the boundary.
export async function uploadEventPicture(
  eventId: string,
  file: File,
  signal?: AbortSignal,
): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await authedFetch(
    `${BASE_URL}/api/events/${encodeURIComponent(eventId)}/picture`,
    { method: "POST", signal, body: form },
  );
  if (!res.ok) {
    throw new ApiError(res.status, `POST event picture failed (${res.status})`);
  }
  const data = (await res.json()) as { imageUrl: string };
  return data.imageUrl;
}

// ── Event registration (event details page) ─────────────────────────────────
// POST /api/users/UserEventCalendar. [Authorize] server-side, so authedFetch.
// No registration service exists: registration_id is a random (non-unique) int and
// status is a coin-flip between "Registered" and "Pending", both generated here.
export async function registerForEvent(
  eventId: string,
  signal?: AbortSignal,
): Promise<CreateEventCalendarRequest["status"]> {
  const body: CreateEventCalendarRequest = {
    event_id: eventId,
    registration_id: Math.floor(Math.random() * 2_000_000_000) + 1,
    status: Math.random() < 0.5 ? "Registered" : "Pending",
  };
  const res = await authedFetch(`${BASE_URL}/api/users/UserEventCalendar`, {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new ApiError(res.status, `POST UserEventCalendar failed (${res.status})`);
  }
  return body.status;
}

// ── Comments (event details page) ────────────────────────────────────────────
// POST /api/users/UserComment -> 201 with the created comment. [Authorize]
// server-side, so authedFetch (bearer token, refresh, 401 retry). The 201 body
// is a UserCommentResponceDTO, which is field-for-field identical to `Comment`,
// so it's returned as-is for the caller to drop straight into the list.
export async function createComment(
  body: { event_id: string; comment: string; rating: number },
  signal?: AbortSignal,
): Promise<Comment> {
  const res = await authedFetch(`${BASE_URL}/api/users/UserComment`, {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new ApiError(res.status, `POST UserComment failed (${res.status})`);
  }
  return (await res.json()) as Comment;
}

// Avatars are served as relative paths (`/uploads/users/...`) from the gateway;
// resolve them against the API base so <img> loads cross-origin in dev.
export function mediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return `${BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

export { ApiError };
