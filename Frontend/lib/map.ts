import type { StyleSpecification } from "maplibre-gl";

// CARTO "Dark Matter" vector basemap.
// NOTE: CARTO's hosted styles/tiles are free for low-volume, non-commercial / evaluation
// use and REQUIRE attribution (kept via the map's AttributionControl). For production,
// swap to a MapTiler key or a self-hosted style — point CARTO_DARK_MATTER_URL at that instead.
export const CARTO_DARK_MATTER_URL =
  "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

// Obsidian palette pulled from DESIGN.md tokens (see app/globals.css @theme).
const OBSIDIAN = {
  background: "#0e0e10", // --color-surface-lowest (matches the venue card map area)
  water: "#08080a", // a touch below background so coastlines read faintly
  road: "#26262a", // low-contrast gray, between surface-container and -high
  label: "#6b6e70", // muted gray label text
  labelHalo: "#0e0e10", // halo == background so labels don't glow
} as const;

// Accent reserved for interactive/branded map elements only (marker + route line).
export const MAP_ACCENT = "#6466f1"; // --color-indigo
export const MAP_ON_SURFACE = "#e5e1e4"; // --color-on-surface

/**
 * Fetch the CARTO Dark Matter style and patch its paint properties toward the
 * DESIGN.md "obsidian" palette: near-black fills, muted gray roads/labels, and
 * the indigo accent left untouched (we only apply accent to our own layers).
 * Kept intentionally small + generic so the palette is easy to tweak later.
 */
export async function getObsidianStyle(
  signal?: AbortSignal,
): Promise<StyleSpecification> {
  const res = await fetch(CARTO_DARK_MATTER_URL, { signal });
  if (!res.ok) {
    throw new Error(`Failed to load base map style (${res.status})`);
  }
  const style = (await res.json()) as StyleSpecification;

  for (const layer of style.layers ?? []) {
    const id = layer.id?.toLowerCase() ?? "";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const paint = ((layer as any).paint ??= {});

    switch (layer.type) {
      case "background":
        paint["background-color"] = OBSIDIAN.background;
        break;
      case "fill":
        paint["fill-color"] = id.includes("water")
          ? OBSIDIAN.water
          : OBSIDIAN.background;
        break;
      case "line":
        paint["line-color"] = OBSIDIAN.road;
        break;
      case "symbol":
        paint["text-color"] = OBSIDIAN.label;
        paint["text-halo-color"] = OBSIDIAN.labelHalo;
        break;
    }
  }

  return style;
}

// ── Routing (OSRM-compatible) ───────────────────────────────────────────────
// Configurable so the public demo can be replaced in prod.
// NOTE: router.project-osrm.org is a shared DEMO server — heavily rate-limited
// and NOT for production. Set NEXT_PUBLIC_OSRM_URL to a self-hosted/managed OSRM.
export const OSRM_BASE_URL =
  process.env.NEXT_PUBLIC_OSRM_URL ?? "https://router.project-osrm.org";

export interface LngLat {
  lng: number;
  lat: number;
}

export interface RouteResult {
  distanceMeters: number;
  durationSeconds: number;
  geometry: GeoJSON.LineString;
}

/** Request a driving route from->to via an OSRM `/route` endpoint. */
export async function fetchRoute(
  from: LngLat,
  to: LngLat,
  signal?: AbortSignal,
): Promise<RouteResult> {
  const coords = `${from.lng},${from.lat};${to.lng},${to.lat}`;
  const url = `${OSRM_BASE_URL}/route/v1/driving/${coords}?geometries=geojson&overview=full`;

  const res = await fetch(url, { signal });
  if (!res.ok) {
    throw new Error(`Routing request failed (${res.status})`);
  }
  const data = (await res.json()) as {
    code?: string;
    routes?: { distance: number; duration: number; geometry: GeoJSON.LineString }[];
  };
  const route = data.routes?.[0];
  if (data.code !== "Ok" || !route) {
    throw new Error("No route found");
  }
  return {
    distanceMeters: route.distance,
    durationSeconds: route.duration,
    geometry: route.geometry,
  };
}

/** Coordinate sanity check before we try to render a map. */
export function isValidCoord(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180 &&
    !(lat === 0 && lng === 0)
  );
}

/** "1.2 km" / "640 m" */
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

/** "8 min" / "1 h 12 min" */
export function formatDuration(seconds: number): string {
  const totalMin = Math.round(seconds / 60);
  if (totalMin < 60) return `${totalMin} min`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}
