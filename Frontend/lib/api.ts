import type {
  EventCatalogEvent,
  EventDetails,
  EventWithOrganizer,
  Organizer,
  PagedResult,
  UpcomingEvent,
  UserDashboardResponse,
} from "./types";

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
// Cache the dashboard per user for the lifetime of the tab so navigating away
// and back doesn't re-hit the aggregator. This is the lightweight equivalent of
// a React Query cache without pulling in a second data layer.
const dashboardCache = new Map<string, UserDashboardResponse>();

// Primary call: profile + joined-event calendars + comment activity.
//
// TODO(auth): this endpoint is [Authorize] (Keycloak). For now the dev token is
// read from NEXT_PUBLIC_DEV_BEARER_TOKEN and attached verbatim — there is no
// login flow, refresh, logout, or role check. A real implementation needs:
//   - an interactive Keycloak login redirect (Authorization Code + PKCE),
//   - access-token refresh before expiry + retry on 401,
//   - logout that clears the session,
//   - role/scope checks (and a `sub`-vs-userId guard once this moves to
//     /dashboard so a user can only load their own dashboard).
// Do not ship the dev-token shortcut to production.
export async function getUserDashboard(
  userId: string,
  signal?: AbortSignal,
): Promise<UserDashboardResponse> {
  const cached = dashboardCache.get(userId);
  if (cached) return cached;

  const token = process.env.NEXT_PUBLIC_DEV_BEARER_TOKEN;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(
    `${BASE_URL}/api/aggregator/user-dashboard/${encodeURIComponent(userId)}`,
    { signal, headers },
  );
  if (!res.ok) {
    throw new ApiError(
      res.status,
      `GET user-dashboard failed (${res.status})`,
    );
  }
  const data = (await res.json()) as UserDashboardResponse;
  dashboardCache.set(userId, data);
  return data;
}

export { ApiError };
