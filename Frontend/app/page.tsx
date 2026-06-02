"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getUpcomingEvents } from "@/lib/api";
import { formatDateRange } from "@/lib/format";
import type { UpcomingEvent } from "@/lib/types";
import { resolveAssetUrl } from "@/lib/url";

export default function HomePage() {
  const [events, setEvents] = useState<UpcomingEvent[] | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    getUpcomingEvents(controller.signal).then(setEvents);
    return () => controller.abort();
  }, []);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-[1200px] px-5 py-12 sm:px-8">
        <h1 className="text-3xl font-semibold tracking-[var(--tracking-headline)]">
          Upcoming Events
        </h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          Select an event to view its details page.
        </p>

        {events === null && (
          <p className="mt-10 text-sm text-muted">Loading…</p>
        )}
        {events?.length === 0 && (
          <p className="mt-10 text-sm text-muted">
            No events found. Is the API gateway running on{" "}
            {process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:10000"}?
          </p>
        )}

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {events?.map((ev) => (
            <Link
              key={ev.id}
              href={`/events/${ev.id}`}
              className="group overflow-hidden rounded-[var(--radius-card)] border border-white/[0.07] bg-surface-low transition-colors hover:border-white/20"
            >
              <div className="h-40 w-full overflow-hidden bg-surface-container">
                {ev.pictureUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={resolveAssetUrl(ev.pictureUrl)!}
                    alt={ev.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-surface-high to-black" />
                )}
              </div>
              <div className="p-4">
                <h2 className="line-clamp-2 text-base font-medium text-on-surface">
                  {ev.title}
                </h2>
                <p className="mt-1 text-xs text-muted">
                  {formatDateRange(ev.startDate, ev.endDate)}
                </p>
                <p className="mt-1 truncate text-xs text-on-surface-variant">
                  {ev.fullLocation}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
