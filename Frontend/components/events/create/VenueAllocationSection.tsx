"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SearchIcon } from "@/components/icons";
import type { Venue } from "@/lib/types";
import { VenueCard } from "./VenueCard";
import {
  inputClass,
  labelClass,
  sectionCardClass,
  sectionHeadingClass,
  sectionSubtitleClass,
} from "./formStyles";

const PAGE_SIZE = 9;
const COLUMNS = 3; // desktop grid; arrow Up/Down move by this many
const DEBOUNCE_MS = 200;

export function VenueAllocationSection({
  venues,
  selectedVenueId,
  capacityErrorText,
  disabled,
  onToggleVenue,
}: {
  venues: Venue[];
  selectedVenueId: number | null;
  capacityErrorText: string | null;
  disabled: boolean;
  onToggleVenue: (venue: Venue) => void;
}) {
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [activeIndex, setActiveIndex] = useState(0);
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Debounce the search box (200ms) and reset to page 1 on a new query.
  useEffect(() => {
    const id = window.setTimeout(() => {
      setQuery(searchInput.trim().toLowerCase());
      setPage(1);
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [searchInput]);

  const filtered = useMemo(() => {
    if (!query) return venues;
    return venues.filter(
      (v) =>
        v.name.toLowerCase().includes(query) ||
        v.city.toLowerCase().includes(query) ||
        v.country.toLowerCase().includes(query),
    );
  }, [venues, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageVenues = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  // Keep the roving focus index within the current page's bounds.
  useEffect(() => {
    setActiveIndex(0);
  }, [safePage, query]);

  function focusCard(index: number) {
    const clamped = Math.max(0, Math.min(index, pageVenues.length - 1));
    setActiveIndex(clamped);
    cardRefs.current[clamped]?.focus();
  }

  function onCardKeyDown(e: React.KeyboardEvent, index: number) {
    switch (e.key) {
      case "ArrowRight":
        e.preventDefault();
        focusCard(index + 1);
        break;
      case "ArrowLeft":
        e.preventDefault();
        focusCard(index - 1);
        break;
      case "ArrowDown":
        e.preventDefault();
        focusCard(index + COLUMNS);
        break;
      case "ArrowUp":
        e.preventDefault();
        focusCard(index - COLUMNS);
        break;
    }
  }

  function clearSearch() {
    setSearchInput("");
    setQuery("");
    setPage(1);
  }

  const selectedVenue = venues.find((v) => v.id === selectedVenueId) ?? null;

  return (
    <section className={sectionCardClass} aria-labelledby="venue-heading">
      <h2 id="venue-heading" className={sectionHeadingClass}>
        Venue Allocation
      </h2>
      <p className={sectionSubtitleClass}>
        Search the registry and pick exactly one venue. The event inherits its
        address.
      </p>

      {/* Search */}
      <div className="mt-6">
        <label htmlFor="venue-search" className={labelClass}>
          Search venues
        </label>
        <div className="relative">
          <SearchIcon
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            width={15}
            height={15}
          />
          <input
            id="venue-search"
            type="text"
            value={searchInput}
            disabled={disabled}
            onChange={(e) => setSearchInput(e.target.value)}
            // Enter here filters; it must not submit the whole event form.
            onKeyDown={(e) => {
              if (e.key === "Enter") e.preventDefault();
            }}
            placeholder="Filter by name, city, or country…"
            className={`${inputClass(false)} pl-9`}
          />
        </div>
      </div>

      {/* Selected-venue status (visually hidden, announced to SR) */}
      <p className="sr-only" role="status" aria-live="polite">
        {selectedVenue ? `Selected: ${selectedVenue.name}` : "No venue selected"}
      </p>

      {/* Grid / empty state */}
      {filtered.length === 0 ? (
        <div className="mt-6 flex flex-col items-center gap-3 rounded-[var(--radius-card)] border border-white/[0.08] bg-surface-low py-12 text-center">
          <p className="text-sm text-on-surface-variant">
            No venues match your search
          </p>
          <button
            type="button"
            onClick={clearSearch}
            className="rounded px-3 py-1.5 text-sm text-on-surface-variant/80 transition-colors hover:text-on-surface"
          >
            Clear search
          </button>
        </div>
      ) : (
        <>
          <div
            role="listbox"
            aria-label="Venues"
            className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {pageVenues.map((venue, i) => (
              <VenueCard
                key={venue.id}
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                venue={venue}
                selected={venue.id === selectedVenueId}
                capacityErrorText={capacityErrorText}
                tabIndex={i === activeIndex ? 0 : -1}
                onToggle={() => onToggleVenue(venue)}
                onKeyDown={(e) => onCardKeyDown(e, i)}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="rounded border border-white/[0.12] px-3 py-1.5 text-sm text-on-surface-variant transition-colors hover:border-white/[0.22] hover:text-on-surface disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm text-muted" aria-live="polite">
                Page {safePage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className="rounded border border-white/[0.12] px-3 py-1.5 text-sm text-on-surface-variant transition-colors hover:border-white/[0.22] hover:text-on-surface disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
