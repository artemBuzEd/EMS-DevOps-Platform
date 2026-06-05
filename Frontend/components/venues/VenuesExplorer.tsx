"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { CloseIcon, SearchIcon, SpinnerIcon } from "@/components/icons";
import { CenterMessage } from "@/components/AppShell";
import { getAllVenues } from "@/lib/api";
import { useResource } from "@/lib/useResource";
import type { Venue } from "@/lib/types";
import { VenueListCard } from "./VenueListCard";

// MapLibre touches `window`, so keep the map out of SSR and the initial bundle.
const VenuesMap = dynamic(() => import("./VenuesMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-surface-lowest">
      <span className="text-xs text-muted">Loading map…</span>
    </div>
  ),
});

const DEBOUNCE_MS = 200;

export function VenuesExplorer() {
  const res = useResource<Venue[]>((signal) => getAllVenues(signal), []);

  if (res.status === "loading") {
    return <CenterMessage title="Loading venues…" />;
  }
  if (res.status === "error") {
    return (
      <CenterMessage
        title="Couldn't load venues"
        subtitle="Something went wrong reaching the server. Is the API gateway running?"
        action={
          <button
            type="button"
            onClick={res.retry}
            className="mt-6 inline-flex items-center gap-2 rounded-md border border-white/[0.12] bg-surface-low px-4 py-2 text-sm font-medium text-on-surface transition-colors hover:border-white/[0.22] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo"
          >
            <SpinnerIcon width={15} height={15} />
            Retry
          </button>
        }
      />
    );
  }

  return <VenuesView venues={res.data} />;
}

type MobileView = "list" | "map";

function VenuesView({ venues }: { venues: Venue[] }) {
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [mobileView, setMobileView] = useState<MobileView>("list");
  const cardRefs = useRef<Map<number, HTMLButtonElement | null>>(new Map());

  // Debounce the search box (200ms).
  useEffect(() => {
    const t = window.setTimeout(
      () => setQuery(searchInput.trim().toLowerCase()),
      DEBOUNCE_MS,
    );
    return () => window.clearTimeout(t);
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

  // Drop the selection if its venue is filtered out, so the map/list never
  // highlight something that's no longer shown.
  useEffect(() => {
    if (selectedId != null && !filtered.some((v) => v.id === selectedId)) {
      setSelectedId(null);
    }
  }, [filtered, selectedId]);

  // Bring the selected card into view (e.g. when the selection came from the map).
  useEffect(() => {
    if (selectedId == null) return;
    cardRefs.current
      .get(selectedId)
      ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedId]);

  const toggleSelect = (id: number) =>
    setSelectedId((cur) => (cur === id ? null : id));

  return (
    <div className="mx-auto max-w-[1200px] px-5 py-10 sm:px-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">
          Venues
        </h1>
        <p className="mt-2 max-w-xl text-sm text-on-surface-variant">
          Browse every venue in the registry. Search by name or city, then pick
          one to locate it on the map.
        </p>

        <div className="relative mt-6 max-w-md">
          <label htmlFor="venue-search" className="sr-only">
            Search venues
          </label>
          <SearchIcon
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
            width={18}
            height={18}
          />
          <input
            id="venue-search"
            type="search"
            aria-label="Search venues by name, city, or country"
            placeholder="Search venues…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape" && searchInput) {
                e.preventDefault();
                setSearchInput("");
              }
            }}
            className="w-full rounded-md border border-white/10 bg-surface-low py-3 pl-11 pr-11 text-base text-on-surface placeholder:text-muted focus:border-indigo/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo/40 [&::-webkit-search-cancel-button]:hidden"
          />
          {searchInput ? (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setSearchInput("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted transition-colors hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo"
            >
              <CloseIcon width={16} height={16} />
            </button>
          ) : null}
        </div>

        <p className="mt-3 text-sm text-muted" aria-live="polite">
          {filtered.length} {filtered.length === 1 ? "venue" : "venues"}
        </p>
      </header>

      {/* Mobile-only List/Map switch (the two can't share a small screen). */}
      <div className="mt-5 inline-flex rounded-md border border-white/[0.12] p-0.5 lg:hidden">
        {(["list", "map"] as const).map((v) => (
          <button
            key={v}
            type="button"
            aria-pressed={mobileView === v}
            onClick={() => setMobileView(v)}
            className={`rounded px-5 py-1.5 text-sm font-medium capitalize transition-colors ${
              mobileView === v
                ? "bg-surface-high text-on-surface"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {v}
          </button>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:gap-8">
        {/* List */}
        <div
          className={`${mobileView === "map" ? "hidden" : "block"} lg:block lg:w-[400px] lg:shrink-0`}
        >
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-[var(--radius-card)] border border-white/[0.08] bg-surface-low py-12 text-center">
              <p className="text-sm text-on-surface-variant">
                No venues match your search.
              </p>
              <button
                type="button"
                onClick={() => setSearchInput("")}
                className="rounded px-3 py-1.5 text-sm text-on-surface-variant/80 transition-colors hover:text-on-surface"
              >
                Clear search
              </button>
            </div>
          ) : (
            <ul className="space-y-3">
              {filtered.map((v) => (
                <li key={v.id}>
                  <VenueListCard
                    ref={(el) => {
                      cardRefs.current.set(v.id, el);
                    }}
                    venue={v}
                    selected={v.id === selectedId}
                    onSelect={() => toggleSelect(v.id)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Map */}
        <div
          className={`${mobileView === "list" ? "hidden" : "block"} h-[50vh] overflow-hidden rounded-[var(--radius-card)] border border-white/[0.07] lg:block lg:h-[70vh] lg:flex-1 lg:sticky lg:top-20`}
        >
          <VenuesMap
            venues={filtered}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </div>
      </div>
    </div>
  );
}
