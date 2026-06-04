"use client";

import { Suspense } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FlashToast } from "@/components/FlashToast";
import { SearchHero } from "@/components/home/SearchHero";
import { FilterSidebar } from "@/components/home/FilterSidebar";
import { ActiveFilters } from "@/components/home/ActiveFilters";
import { EventCard } from "@/components/home/EventCard";
import { LoadMoreButton } from "@/components/home/LoadMoreButton";
import {
  CardSkeletonGrid,
  EmptyResults,
  ErrorState,
  InitialEmpty,
} from "@/components/home/ListStates";
import { useEventListing } from "@/components/home/useEventListing";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        {/* useSearchParams (inside useEventListing) requires a Suspense boundary. */}
        <Suspense fallback={<HeroFallback />}>
          <EventListing />
        </Suspense>
        <Suspense fallback={null}>
          <FlashToast
            resolve={(p) =>
              p.get("denied") === "create-event"
                ? "You don't have permission to create events."
                : null
            }
            stripParams={["denied"]}
          />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

function HeroFallback() {
  return (
    <div className="mx-auto max-w-[1200px] px-5 py-16 sm:px-8">
      <CardSkeletonGrid />
    </div>
  );
}

function EventListing() {
  const l = useEventListing();
  const displayTotal = l.total;

  const showInitialEmpty =
    l.status === "ready" &&
    l.visible.length === 0 &&
    l.activeFilterCount === 0 &&
    l.total === 0;
  const showEmptyResults =
    l.status === "ready" &&
    l.visible.length === 0 &&
    (l.activeFilterCount > 0 || l.dateError);

  return (
    <>
      <SearchHero
        value={l.searchInput}
        onChange={l.setSearchInput}
        onClear={l.clearSearch}
      />

      <div className="mx-auto flex max-w-[1200px] flex-col gap-8 px-5 py-10 sm:px-8 lg:flex-row lg:gap-10 lg:py-12">
        <FilterSidebar
          filters={l.filters}
          dateError={l.dateError}
          setFrom={l.setFrom}
          setTo={l.setTo}
          toggleUpcoming={l.toggleUpcoming}
          setCategory={l.setCategory}
          setSort={l.setSort}
          activeFilterCount={l.activeFilterCount}
        />

        <div className="min-w-0 flex-1">
          <ActiveFilters
            filters={l.filters}
            count={l.visible.length}
            activeFilterCount={l.activeFilterCount}
            onRemove={l.removeFilter}
            onClearAll={l.clearAll}
          />

          {/* Visually-hidden live region: announces the result count on change. */}
          <p aria-live="polite" className="sr-only">
            {l.status === "ready"
              ? `Showing ${l.visible.length} of ${displayTotal} events`
              : ""}
          </p>

          <div className="mt-6">
            {l.status === "error" ? (
              <ErrorState onRetry={l.retry} />
            ) : l.status === "loading" ? (
              <CardSkeletonGrid />
            ) : showInitialEmpty ? (
              <InitialEmpty />
            ) : showEmptyResults ? (
              <EmptyResults
                summary={emptySummary(l.filters, l.dateError)}
                onClear={l.clearAll}
              />
            ) : (
              <>
                <ul className="grid-events-wide grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {l.visible.map((event) => (
                    <li key={event.id}>
                      <EventCard event={event} />
                    </li>
                  ))}
                </ul>
                {l.hasMore ? (
                  <LoadMoreButton loading={l.loadingMore} onClick={l.loadMore} />
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function emptySummary(
  filters: ReturnType<typeof useEventListing>["filters"],
  dateError: boolean,
): string {
  if (dateError) return "The selected date range is invalid.";
  const parts: string[] = [];
  if (filters.search.trim()) parts.push(`matching “${filters.search.trim()}”`);
  if (filters.category.trim())
    parts.push(`in category “${filters.category.trim()}”`);
  if (filters.upcoming) parts.push("that are upcoming");
  if (filters.from || filters.to) parts.push("in that date range");
  return parts.length
    ? `No events ${parts.join(", ")}. Try removing a filter.`
    : "Try removing a filter or searching for something else.";
}
