"use client";

import { CloseIcon } from "@/components/icons";
import type { Filters } from "./useEventListing";

const chipDate = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
});

function fmt(d: string) {
  const t = new Date(d);
  return isNaN(t.getTime()) ? d : chipDate.format(t);
}

interface Chip {
  key: keyof Filters;
  label: string;
}

export function ActiveFilters({
  filters,
  count,
  activeFilterCount,
  onRemove,
  onClearAll,
}: {
  filters: Filters;
  count: number;
  activeFilterCount: number;
  onRemove: (key: keyof Filters) => void;
  onClearAll: () => void;
}) {
  const chips: Chip[] = [];
  if (filters.search.trim())
    chips.push({ key: "search", label: `Search: ${filters.search.trim()}` });
  if (filters.upcoming) chips.push({ key: "upcoming", label: "Upcoming only" });
  if (filters.from) chips.push({ key: "from", label: `After: ${fmt(filters.from)}` });
  if (filters.to) chips.push({ key: "to", label: `Before: ${fmt(filters.to)}` });
  if (filters.category.trim())
    chips.push({ key: "category", label: `Category: ${filters.category.trim()}` });

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-on-surface-variant">
        {count} {count === 1 ? "event" : "events"} found
      </span>

      {chips.length > 0 ? (
        <span className="mx-1 h-4 w-px bg-white/10" aria-hidden />
      ) : null}

      {chips.map((c) => (
        <span
          key={c.key}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.12] bg-surface-container py-1 pl-3 pr-1.5 text-xs text-on-surface"
        >
          {c.label}
          <button
            type="button"
            aria-label={`Remove filter: ${c.label}`}
            onClick={() => onRemove(c.key)}
            className="rounded-full p-0.5 text-muted transition-colors hover:bg-white/10 hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo"
          >
            <CloseIcon width={13} height={13} />
          </button>
        </span>
      ))}

      {activeFilterCount >= 2 ? (
        <button
          type="button"
          onClick={onClearAll}
          className="text-xs text-secondary underline-offset-2 transition-colors hover:text-on-surface hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo"
        >
          Clear all filters
        </button>
      ) : null}
    </div>
  );
}
