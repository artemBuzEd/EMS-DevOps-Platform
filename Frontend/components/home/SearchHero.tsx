"use client";

import { useRef } from "react";
import { CloseIcon, SearchIcon } from "@/components/icons";

// Compact, utility hero (not a marketing carousel): one headline, one subhead,
// and the global search box. Capped height via padding so it stays ≤240px tall.
export function SearchHero({
  value,
  onChange,
  onClear,
}: {
  value: string;
  onChange: (v: string) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <section
      aria-labelledby="hero-heading"
      className="border-b border-white/[0.07] bg-gradient-to-b from-surface-container/40 to-transparent"
    >
      <div className="mx-auto max-w-[1200px] px-5 py-12 sm:px-8 sm:py-14">
        <h1
          id="hero-heading"
          className="text-4xl font-semibold tracking-[var(--tracking-display)] sm:text-5xl"
        >
          Discover events
        </h1>
        <p className="mt-3 max-w-xl text-base text-on-surface-variant">
          Concerts, conferences and meetups — find something worth showing up for.
        </p>

        <div className="relative mt-7 max-w-2xl">
          <label htmlFor="event-search" className="sr-only">
            Search events
          </label>
          <SearchIcon
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
            width={18}
            height={18}
          />
          <input
            id="event-search"
            ref={inputRef}
            type="search"
            role="searchbox"
            aria-label="Search events by title or description"
            placeholder="Search events…"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              // Esc clears and keeps focus for fast re-querying.
              if (e.key === "Escape" && value) {
                e.preventDefault();
                onClear();
                inputRef.current?.focus();
              }
            }}
            className="w-full rounded-md border border-white/10 bg-surface-low py-3 pl-11 pr-11 text-base text-on-surface placeholder:text-muted focus:border-indigo/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo/40 [&::-webkit-search-cancel-button]:hidden"
          />
          {value ? (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                onClear();
                inputRef.current?.focus();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted transition-colors hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo"
            >
              <CloseIcon width={16} height={16} />
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
