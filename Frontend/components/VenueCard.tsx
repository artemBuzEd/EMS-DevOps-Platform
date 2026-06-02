"use client";

import dynamic from "next/dynamic";
import { Card, CardHeading } from "./primitives";
import { VenueIcon } from "./icons";
import { isValidCoord } from "@/lib/map";
import type { Venue } from "@/lib/types";

// Client-only: MapLibre touches `window`, so keep it out of SSR and the initial bundle.
const VenueMap = dynamic(() => import("./VenueMap"), {
  ssr: false,
  loading: () => (
    <div className="mt-5 flex h-56 items-center justify-center rounded-md border border-white/[0.07] bg-surface-lowest">
      <span className="text-xs text-muted">Loading map…</span>
    </div>
  ),
});

export function VenueCard({
  venue,
  fallbackLocation,
}: {
  venue: Venue | null;
  fallbackLocation: string;
}) {
  const name = venue?.name ?? "Venue";
  const address = venue
    ? [venue.address, venue.city, venue.country].filter(Boolean).join(", ")
    : fallbackLocation;
  const hasCoords =
    venue != null && isValidCoord(venue.latitude, venue.longitude);

  return (
    <Card>
      <CardHeading>Venue Location</CardHeading>

      <div className="mt-4 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-surface-container text-on-surface-variant">
          <VenueIcon />
        </span>
        <div>
          <div className="text-sm font-medium text-on-surface">{name}</div>
          <div className="text-xs text-on-surface-variant">{address}</div>
        </div>
      </div>

      {hasCoords ? (
        <VenueMap
          latitude={venue!.latitude}
          longitude={venue!.longitude}
          name={name}
        />
      ) : (
        <div className="mt-5 flex h-56 items-center justify-center rounded-md border border-white/[0.07] bg-surface-lowest">
          <span className="text-xs text-muted">
            Map unavailable — no coordinates for this venue.
          </span>
        </div>
      )}
    </Card>
  );
}
