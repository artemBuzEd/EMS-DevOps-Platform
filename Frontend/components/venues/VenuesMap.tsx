"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl, { type StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MAP_ACCENT, getObsidianStyle, isValidCoord } from "@/lib/map";
import type { Venue } from "@/lib/types";

// Geographic centre of Ukraine — the initial view before fitBounds runs (all the
// seeded venues are Ukrainian) and the fallback if a venue set has no coordinates.
const UA_CENTER: [number, number] = [31.1656, 48.3794];

// A marker is a plain root element (which MapLibre positions by writing
// `transform: translate(...)` onto it — so we MUST NOT set transform there, or
// the marker snaps to the 0,0 origin) wrapping a child "dot" we style freely.
function createMarker(name: string): { root: HTMLElement; dot: HTMLElement } {
  const root = document.createElement("div");
  root.title = name;
  root.style.cursor = "pointer";

  const dot = document.createElement("div");
  Object.assign(dot.style, {
    width: "13px",
    height: "13px",
    borderRadius: "9999px",
    background: MAP_ACCENT,
    border: "2px solid #e5e1e4",
    boxShadow: `0 0 0 3px ${MAP_ACCENT}33`,
    transition: "transform 120ms ease, box-shadow 120ms ease",
  });
  root.appendChild(dot);
  return { root, dot };
}

// Selection emphasis lives on the dot (transform/shadow) and the root (z-index,
// to lift it above neighbours) — never the root's transform.
function setSelected(root: HTMLElement, dot: HTMLElement, selected: boolean) {
  dot.style.transform = selected ? "scale(1.6)" : "scale(1)";
  dot.style.boxShadow = selected
    ? `0 0 0 6px ${MAP_ACCENT}55`
    : `0 0 0 3px ${MAP_ACCENT}33`;
  root.style.zIndex = selected ? "2" : "";
}

// A single MapLibre map plotting every (filtered) venue as a marker. Selection is
// two-way: clicking a marker calls onSelect; a change in selectedId flies to that
// venue and emphasises its marker. The map is the canonical single instance — we
// never mount one per card. Client-only (dynamic-imported with ssr:false) because
// MapLibre touches `window`.
export default function VenuesMap({
  venues,
  selectedId,
  onSelect,
}: {
  venues: Venue[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<
    Map<number, { marker: maplibregl.Marker; root: HTMLElement; dot: HTMLElement }>
  >(new Map());
  const [ready, setReady] = useState(false);

  // Keep the latest onSelect in a ref so marker click handlers (bound once when a
  // marker is created) never go stale, and don't force markers to be rebuilt.
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  // ── Initialise the map once. ─────────────────────────────────────────────
  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;

    (async () => {
      if (!containerRef.current) return;
      let style: StyleSpecification;
      try {
        style = await getObsidianStyle(controller.signal);
      } catch {
        return; // fail-soft: leave the dark container in place
      }
      if (cancelled || !containerRef.current) return;

      const map = new maplibregl.Map({
        container: containerRef.current,
        style,
        center: UA_CENTER,
        zoom: 4.5,
        attributionControl: { compact: true },
      });
      mapRef.current = map;

      map.dragRotate.disable();
      map.touchZoomRotate.disableRotation();
      map.keyboard.disableRotation();
      map.addControl(
        new maplibregl.NavigationControl({
          showCompass: false,
          visualizePitch: false,
        }),
        "top-right",
      );

      // Keep the canvas in sync with its container — covers the mobile List/Map
      // toggle, which un-hides the map from display:none (0 → real size).
      resizeObserver = new ResizeObserver(() => map.resize());
      resizeObserver.observe(containerRef.current);

      map.on("load", () => {
        if (cancelled) return;
        // The container can still be settling its flex/sticky size when the map
        // is constructed; sync the transform to the real size before fitBounds.
        map.resize();
        setReady(true);
      });
    })();

    return () => {
      cancelled = true;
      controller.abort();
      resizeObserver?.disconnect();
      markersRef.current.forEach(({ marker }) => marker.remove());
      markersRef.current.clear();
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // ── (Re)build markers when the visible venue set changes. ────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    // Guarantee the transform matches the current container size before placing
    // markers / fitting bounds — covers first paint and the mobile List/Map
    // toggle (where the map un-hides from display:none).
    map.resize();

    markersRef.current.forEach(({ marker }) => marker.remove());
    markersRef.current.clear();

    const bounds = new maplibregl.LngLatBounds();
    let count = 0;
    for (const v of venues) {
      if (!isValidCoord(v.latitude, v.longitude)) continue;
      const { root, dot } = createMarker(v.name);
      root.addEventListener("click", (e) => {
        e.stopPropagation();
        onSelectRef.current(v.id);
      });
      const marker = new maplibregl.Marker({ element: root, anchor: "center" })
        .setLngLat([v.longitude, v.latitude])
        .addTo(map);
      markersRef.current.set(v.id, { marker, root, dot });
      bounds.extend([v.longitude, v.latitude]);
      count++;
    }

    if (count > 0) {
      map.fitBounds(bounds, { padding: 64, maxZoom: 12, animate: false });
    } else {
      map.easeTo({ center: UA_CENTER, zoom: 4.5, duration: 0 });
    }
  }, [venues, ready]);

  // ── Reflect selection: emphasise the marker + fly to it. ─────────────────
  useEffect(() => {
    if (!ready) return;
    markersRef.current.forEach(({ root, dot }, id) =>
      setSelected(root, dot, id === selectedId),
    );

    const map = mapRef.current;
    if (!map || selectedId == null) return;
    const v = venues.find((x) => x.id === selectedId);
    if (v && isValidCoord(v.latitude, v.longitude)) {
      map.flyTo({
        center: [v.longitude, v.latitude],
        zoom: 13,
        duration: 800,
        essential: true,
      });
    }
  }, [selectedId, ready, venues]);

  return <div ref={containerRef} className="h-full w-full" />;
}
