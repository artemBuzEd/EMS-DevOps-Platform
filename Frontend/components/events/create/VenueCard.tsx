"use client";

import { forwardRef } from "react";
import { MapPinIcon, UsersIcon } from "@/components/icons";
import { formatNumber } from "@/lib/format";
import type { Venue } from "@/lib/types";

// A selectable venue tile. It's a real <button> with aria-pressed so it's keyboard
// operable and announced as a toggle. Selected = 4px indigo border + checkmark
// badge (indigo, never lime). When the chosen event capacity exceeds this venue's
// capacity, the card surfaces the same error shown on the capacity field.
export const VenueCard = forwardRef<
  HTMLButtonElement,
  {
    venue: Venue;
    selected: boolean;
    capacityErrorText: string | null;
    tabIndex: number;
    onToggle: () => void;
    onKeyDown: (e: React.KeyboardEvent) => void;
  }
>(function VenueCard(
  { venue, selected, capacityErrorText, tabIndex, onToggle, onKeyDown },
  ref,
) {
  const showCapError = selected && !!capacityErrorText;

  return (
    <button
      ref={ref}
      type="button"
      role="option"
      aria-pressed={selected}
      aria-label={`${venue.name}, ${venue.city}, ${venue.country}${
        selected ? " (selected, click to deselect)" : ""
      }`}
      title={selected ? "Click to deselect" : undefined}
      tabIndex={tabIndex}
      onClick={onToggle}
      onKeyDown={onKeyDown}
      className={[
        "relative flex flex-col rounded-[var(--radius-card)] bg-surface-low p-4 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary-container",
        selected
          ? "border-4 border-secondary-container"
          : showCapError
            ? "border border-error"
            : "border border-white/[0.08] hover:border-white/[0.22]",
      ].join(" ")}
    >
      {/* top-right icon: map normally, checkmark when selected */}
      <span className="absolute right-3 top-3">
        {selected ? (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary-container text-white">
            <svg
              width={14}
              height={14}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="m5 13 4 4L19 7" />
            </svg>
          </span>
        ) : (
          <MapPinIcon className="text-muted" width={16} height={16} />
        )}
      </span>

      <span className="pr-8 text-sm font-semibold text-on-surface">
        {venue.name}
      </span>
      <span className="mt-0.5 text-xs text-muted">
        {venue.city}, {venue.country}
      </span>
      <span className="mt-3 inline-flex items-center gap-1.5 text-xs text-on-surface-variant">
        <UsersIcon width={14} height={14} />
        {venue.capacity != null ? formatNumber(venue.capacity) : "—"}
      </span>

      {showCapError && (
        <span className="mt-2 text-xs text-error">{capacityErrorText}</span>
      )}
    </button>
  );
});
