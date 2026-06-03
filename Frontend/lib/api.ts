import type {
  EventCatalogEvent,
  EventDetails,
  EventWithOrganizer,
  Organizer,
  PagedResult,
  UpcomingEvent,
  UserDashboardResponse,
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

// Home page listing (fail-soft to empty).
export async function getUpcomingEvents(
  signal?: AbortSignal,
): Promise<UpcomingEvent[]> {
  try {
    const data = await getJson<PagedResult<UpcomingEvent>>(
      `/api/events/upcoming?pageNumber=1&pageSize=12`,
      signal,
    );
    return data.items ?? [];
  } catch {
    return [];
  }
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

export { ApiError };
