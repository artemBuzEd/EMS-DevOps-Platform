"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl, { type StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MapPinIcon } from "./icons";
import {
  MAP_ACCENT,
  fetchRoute,
  formatDistance,
  formatDuration,
  getObsidianStyle,
} from "@/lib/map";

type DirectionsStatus = "idle" | "locating" | "routing" | "ready" | "error";

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export default function VenueMap({
  latitude,
  longitude,
  name,
}: {
  latitude: number;
  longitude: number;
  name: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const mountedRef = useRef(true);

  const [status, setStatus] = useState<DirectionsStatus>("idle");
  const [route, setRoute] = useState<{ distance: number; duration: number } | null>(
    null,
  );
  const [note, setNote] = useState<string | null>(null);

  // ── Initialise the map once, client-side. ───────────────────────────────
  useEffect(() => {
    mountedRef.current = true;
    const controller = new AbortController();
    let cancelled = false;
    let marker: maplibregl.Marker | null = null;

    (async () => {
      if (!containerRef.current) return;
      let style: StyleSpecification;
      try {
        style = await getObsidianStyle(controller.signal);
      } catch {
        if (!cancelled) setNote("Map style could not be loaded.");
        return;
      }
      if (cancelled || !containerRef.current) return;

      const map = new maplibregl.Map({
        container: containerRef.current,
        style,
        center: [longitude, latitude],
        zoom: 14.5,
        attributionControl: { compact: true }, // keep attribution (CARTO terms), compact
      });
      mapRef.current = map;

      // Trim clutter that fights the aesthetic: no rotate/pitch, keep zoom + scroll.
      map.dragRotate.disable();
      map.touchZoomRotate.disableRotation();
      map.keyboard.disableRotation();
      map.addControl(
        new maplibregl.NavigationControl({ showCompass: false, visualizePitch: false }),
        "top-right",
      );

      // Custom marker: indigo dot + venue-name pill, matching the existing design.
      const el = document.createElement("div");
      el.style.display = "flex";
      el.style.flexDirection = "column";
      el.style.alignItems = "center";

      const pill = document.createElement("div");
      pill.textContent = name;
      Object.assign(pill.style, {
        marginBottom: "6px",
        padding: "3px 8px",
        borderRadius: "9999px",
        border: `1px solid ${MAP_ACCENT}80`,
        background: "rgba(32,31,33,0.9)",
        color: "#e5e1e4",
        fontSize: "11px",
        fontWeight: "500",
        whiteSpace: "nowrap",
        backdropFilter: "blur(4px)",
      });

      const dot = document.createElement("div");
      Object.assign(dot.style, {
        width: "14px",
        height: "14px",
        borderRadius: "9999px",
        background: MAP_ACCENT,
        border: "2px solid #e5e1e4",
        boxShadow: `0 0 0 4px ${MAP_ACCENT}40`,
      });

      el.append(pill, dot);
      marker = new maplibregl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([longitude, latitude])
        .addTo(map);
    })();

    return () => {
      cancelled = true;
      mountedRef.current = false;
      controller.abort();
      marker?.remove();
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [latitude, longitude, name]);

  // ── Route drawing helpers. ───────────────────────────────────────────────
  function addRouteToMap(map: maplibregl.Map, geometry: GeoJSON.LineString) {
    if (map.getLayer("route-line")) map.removeLayer("route-line");
    if (map.getSource("route")) map.removeSource("route");

    map.addSource("route", {
      type: "geojson",
      data: { type: "Feature", properties: {}, geometry },
    });
    map.addLayer({
      id: "route-line",
      type: "line",
      source: "route",
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": MAP_ACCENT,
        "line-opacity": 0.9,
        "line-width": ["interpolate", ["linear"], ["zoom"], 10, 2, 16, 6],
      },
    });

    const bounds = new maplibregl.LngLatBounds();
    for (const c of geometry.coordinates) bounds.extend(c as [number, number]);
    bounds.extend([longitude, latitude]);
    map.fitBounds(bounds, {
      padding: 56,
      animate: !prefersReducedMotion(),
      duration: 800,
    });
  }

  function drawRoute(geometry: GeoJSON.LineString) {
    const map = mapRef.current;
    if (!map) return;
    if (map.isStyleLoaded()) addRouteToMap(map, geometry);
    else map.once("idle", () => addRouteToMap(map, geometry));
  }

  // ── "Get directions": geolocation → OSRM route, all fail-soft. ───────────
  function handleDirections() {
    setNote(null);
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("error");
      setNote("Location isn’t available in this browser — showing the venue only.");
      return;
    }

    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        if (!mountedRef.current) return;
        const from = { lng: pos.coords.longitude, lat: pos.coords.latitude };
        setStatus("routing");
        try {
          const result = await fetchRoute(from, { lng: longitude, lat: latitude });
          if (!mountedRef.current) return;
          drawRoute(result.geometry);
          setRoute({ distance: result.distanceMeters, duration: result.durationSeconds });
          setStatus("ready");
        } catch {
          if (!mountedRef.current) return;
          setStatus("error");
          setNote("Couldn’t load a route right now — showing the venue only.");
        }
      },
      (err) => {
        if (!mountedRef.current) return;
        setStatus("error");
        setNote(
          err.code === err.PERMISSION_DENIED
            ? "Location access denied — showing the venue only."
            : "Couldn’t get your location — showing the venue only.",
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }

  const busy = status === "locating" || status === "routing";
  const buttonLabel =
    status === "locating"
      ? "Locating…"
      : status === "routing"
        ? "Routing…"
        : "Get directions";

  return (
    <div className="mt-5">
      <div className="relative h-56 w-full overflow-hidden rounded-md border border-white/[0.07] bg-surface-lowest">
        {/* inline position beats maplibre-gl.css's `.maplibregl-map{position:relative}`,
            keeping the canvas out of flow so it can't collapse the grid column */}
        <div ref={containerRef} className="inset-0" style={{ position: "absolute" }} />

        <button
          type="button"
          onClick={handleDirections}
          disabled={busy}
          className="absolute left-3 top-3 z-10 inline-flex items-center gap-1.5 rounded border border-white/15 bg-black/40 px-3 py-1.5 text-xs font-medium text-on-surface backdrop-blur-sm transition-colors hover:border-white/40 disabled:cursor-default disabled:opacity-60"
        >
          <MapPinIcon width={13} height={13} className="text-indigo" />
          {buttonLabel}
        </button>

        {route && (
          <div className="absolute bottom-3 left-3 z-10 rounded-md border border-white/10 bg-surface-container/90 px-3 py-2 backdrop-blur-sm">
            <div className="font-mono text-[10px] uppercase tracking-[0.05em] text-muted">
              Driving route
            </div>
            <div className="mt-0.5 text-sm text-on-surface">
              {formatDistance(route.distance)} · {formatDuration(route.duration)}
            </div>
          </div>
        )}
      </div>

      {note && <p className="mt-2 text-xs text-on-surface-variant">{note}</p>}
    </div>
  );
}
