"use client";

import { forwardRef } from "react";
import { MapPinIcon, UsersIcon } from "@/components/icons";
import { formatNumber } from "@/lib/format";
import type { Venue } from "@/lib/types";

// A venue row in the explorer list. A real <button> with aria-pressed so it
// reads as a toggle: clicking selects the venue (and flies the map to it);
// clicking again deselects. Selected = indigo border + ring, mirroring the
// selection language used elsewhere (indigo, never lime).
export const VenueListCard = forwardRef<
  HTMLButtonElement,
  {
    venue: Venue;
    selected: boolean;
    onSelect: () => void;
  }
>(function VenueListCard({ venue, selected, onSelect }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      aria-pressed={selected}
      aria-label={`${venue.name}, ${venue.city}, ${venue.country}${
        selected ? " (selected, click to deselect)" : ""
      }`}
      onClick={onSelect}
      className={[
        "flex w-full flex-col rounded-[var(--radius-card)] bg-surface-low p-4 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo",
        selected
          ? "border border-indigo/70 ring-1 ring-indigo/40"
          : "border border-white/[0.08] hover:border-white/[0.22]",
      ].join(" ")}
    >
      <span className="flex items-start justify-between gap-3">
        <span className="min-w-0 text-sm font-semibold text-on-surface">
          {venue.name}
        </span>
        <MapPinIcon
          className={`shrink-0 ${selected ? "text-indigo" : "text-muted"}`}
          width={16}
          height={16}
        />
      </span>
      <span className="mt-0.5 text-xs text-muted">
        {venue.city}, {venue.country}
      </span>
      <span className="mt-1 text-xs text-on-surface-variant">
        {venue.address}
      </span>
      <span className="mt-3 inline-flex items-center gap-1.5 text-xs text-on-surface-variant">
        <UsersIcon width={14} height={14} />
        {venue.capacity != null
          ? `${formatNumber(venue.capacity)} capacity`
          : "Capacity n/a"}
      </span>
    </button>
  );
});
