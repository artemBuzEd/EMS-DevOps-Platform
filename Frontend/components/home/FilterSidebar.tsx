"use client";

import { useState } from "react";
import { CloseIcon, SlidersIcon } from "@/components/icons";
import type { EventListing, SortKey } from "./useEventListing";

type Props = Pick<
  EventListing,
  | "filters"
  | "dateError"
  | "setFrom"
  | "setTo"
  | "toggleUpcoming"
  | "setCategory"
  | "setSort"
  | "activeFilterCount"
>;

const fieldClass =
  "w-full rounded-md border border-white/10 bg-surface-low px-3 py-2 text-sm text-on-surface placeholder:text-muted focus:border-indigo/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo/40 disabled:opacity-40";

const SORTS: { value: SortKey; label: string }[] = [
  { value: "date-asc", label: "Date (soonest)" },
  { value: "date-desc", label: "Date (latest)" },
  { value: "title", label: "Title (A–Z)" },
];

function FilterControls({
  filters,
  dateError,
  setFrom,
  setTo,
  toggleUpcoming,
  setCategory,
  setSort,
}: Omit<Props, "activeFilterCount">) {
  const dateDisabled = filters.upcoming;

  return (
    <div className="flex flex-col gap-7">
      {/* Date range */}
      <fieldset className="flex flex-col gap-3">
        <legend className="text-xs font-medium uppercase tracking-[0.08em] text-muted">
          Date range
        </legend>
        <div className="flex flex-col gap-2">
          <label htmlFor="filter-from" className="text-sm text-on-surface-variant">
            From
          </label>
          <input
            id="filter-from"
            type="date"
            value={filters.from}
            disabled={dateDisabled}
            onChange={(e) => setFrom(e.target.value)}
            className={`${fieldClass} [color-scheme:dark]`}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="filter-to" className="text-sm text-on-surface-variant">
            To
          </label>
          <input
            id="filter-to"
            type="date"
            value={filters.to}
            disabled={dateDisabled}
            onChange={(e) => setTo(e.target.value)}
            className={`${fieldClass} [color-scheme:dark]`}
          />
        </div>
        {dateError ? (
          <p role="alert" className="text-xs text-error">
            “From” date must be on or before “To” date.
          </p>
        ) : null}
        {dateDisabled ? (
          <p className="text-xs text-muted">
            Disabled while “Upcoming only” is on.
          </p>
        ) : null}
      </fieldset>

      {/* Upcoming toggle — mutually exclusive with the date range above. */}
      <div className="flex items-center justify-between gap-3">
        <label htmlFor="filter-upcoming" className="text-sm text-on-surface">
          Upcoming only
        </label>
        <button
          id="filter-upcoming"
          type="button"
          role="switch"
          aria-checked={filters.upcoming}
          onClick={toggleUpcoming}
          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo ${
            filters.upcoming ? "bg-indigo" : "bg-surface-highest"
          }`}
        >
          <span
            className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
              filters.upcoming ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {/* Category — client-side filter on already-fetched results. */}
      <div className="flex flex-col gap-2">
        <label htmlFor="filter-category" className="text-sm text-on-surface">
          Category
        </label>
        <input
          id="filter-category"
          type="text"
          value={filters.category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Filter loaded results by category"
          className={fieldClass}
        />
        <p className="text-xs text-muted">
          Filters the events already loaded — not a server search.
        </p>
      </div>

      {/* Sort — client-side on loaded results. */}
      <div className="flex flex-col gap-2">
        <label htmlFor="filter-sort" className="text-sm text-on-surface">
          Sort by
        </label>
        <select
          id="filter-sort"
          value={filters.sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className={`${fieldClass} [color-scheme:dark]`}
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export function FilterSidebar(props: Props) {
  const [open, setOpen] = useState(false);
  const { activeFilterCount, ...controls } = props;

  return (
    <>
      {/* Desktop: inline sidebar (not a modal). */}
      <aside
        aria-label="Event filters"
        className="hidden lg:block lg:w-64 lg:shrink-0"
      >
        <div className="sticky top-20">
          <h2 className="mb-5 text-sm font-semibold text-on-surface">Filters</h2>
          <FilterControls {...controls} />
        </div>
      </aside>

      {/* Mobile: trigger + bottom-sheet drawer. */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-surface-low px-4 py-2 text-sm text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo"
        >
          <SlidersIcon width={16} height={16} />
          Filters
          {activeFilterCount > 0 ? (
            <span className="rounded-full bg-indigo px-1.5 text-xs font-medium text-white">
              {activeFilterCount}
            </span>
          ) : null}
        </button>

        {open ? (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <button
              type="button"
              aria-label="Close filters"
              onClick={() => setOpen(false)}
              className="absolute inset-0 bg-black/60"
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Event filters"
              className="relative max-h-[85vh] overflow-y-auto rounded-t-2xl border-t border-white/[0.08] bg-surface px-5 pb-8 pt-5"
            >
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-base font-semibold text-on-surface">
                  Filters
                </h2>
                <button
                  type="button"
                  aria-label="Close filters"
                  onClick={() => setOpen(false)}
                  className="rounded-full p-1 text-muted hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo"
                >
                  <CloseIcon width={20} height={20} />
                </button>
              </div>
              <FilterControls {...controls} />
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
