"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { EventHeader } from "@/components/EventHeader";
import { AboutCard } from "@/components/AboutCard";
import { VenueCard } from "@/components/VenueCard";
import { DiscussionCard } from "@/components/DiscussionCard";
import { EventStatusCard } from "@/components/EventStatusCard";
import { OrganizerCard } from "@/components/OrganizerCard";
import { getCategory, getEventDetails, getOrganizer } from "@/lib/api";
import type { EventDetails, Organizer } from "@/lib/types";
import { resolveAssetUrl } from "@/lib/url";

type State =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; details: EventDetails; organizer: Organizer | null; category: string | null };

export default function EventDetailsPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    setState({ kind: "loading" });

    (async () => {
      try {
        const details = await getEventDetails(id, controller.signal);
        // Secondary, fail-soft enrichment in parallel.
        const [organizer, category] = await Promise.all([
          getOrganizer(id, controller.signal),
          getCategory(id, controller.signal),
        ]);
        setState({ kind: "ready", details, organizer, category });
      } catch (err) {
        if (controller.signal.aborted) return;
        const message =
          err && typeof err === "object" && "status" in err && err.status === 404
            ? "This event could not be found."
            : "Could not load this event. Is the API gateway running?";
        setState({ kind: "error", message });
      }
    })();

    return () => controller.abort();
  }, [id]);

  if (state.kind === "loading") {
    return (
      <Shell>
        <CenterMessage title="Loading event…" />
      </Shell>
    );
  }

  if (state.kind === "error") {
    return (
      <Shell>
        <CenterMessage title="Something went wrong" subtitle={state.message} />
      </Shell>
    );
  }
  
  const { details, organizer, category } = state;
  
  if (!details?.event) {
    return (
        <Shell>
          <CenterMessage title="Event not found" />
        </Shell>
    );
  }
  
  const ev = details.event;
  const venue = details.venue;
  const comments = details.comments ?? [];
  const registered = details.registeredUsersCount ?? 0;
  const location = venue?.name ?? ev.fullLocation;
  const city = venue?.city ?? null;

  return (
    <Shell>
      <Hero pictureUrl={resolveAssetUrl(ev.pictureUrl)} title={ev.title} />

      <EventHeader
        title={ev.title}
        description={ev.description}
        startDate={ev.startDate}
        endDate={ev.endDate}
        location={location}
        attendees={registered}
        category={category}
        city={city}
      />

      <div className="mx-auto mt-8 grid max-w-[1200px] grid-cols-1 gap-6 px-5 pb-4 sm:px-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <AboutCard description={ev.description} />
          <VenueCard venue={venue} fallbackLocation={ev.fullLocation} />
          <DiscussionCard comments={comments} />
        </div>

        <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start">
          <EventStatusCard
            registered={registered}
            capacity={ev.capacity}
            endDate={ev.endDate}
          />
          <OrganizerCard organizer={organizer} organizerId={ev.organizerId} />
        </aside>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
}

function CenterMessage({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-center px-5 py-32 text-center">
      <h1 className="text-2xl font-semibold tracking-[-0.02em]">{title}</h1>
      {subtitle && (
        <p className="mt-2 max-w-md text-sm text-on-surface-variant">{subtitle}</p>
      )}
    </div>
  );
}
