"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { FlashToast } from "@/components/FlashToast";
import { Hero } from "@/components/Hero";
import { EventHeader } from "@/components/EventHeader";
import { AboutCard } from "@/components/AboutCard";
import { VenueCard } from "@/components/VenueCard";
import { DiscussionCard } from "@/components/DiscussionCard";
import { EventStatusCard } from "@/components/EventStatusCard";
import { OrganizerCard } from "@/components/OrganizerCard";
import { AttendeesCard } from "@/components/AttendeesCard";
import { CenterMessage } from "@/components/AppShell";
import {
  getCategory,
  getEventAttendees,
  getEventDetails,
  getOrganizer,
} from "@/lib/api";
import { useResource } from "@/lib/useResource";
import type { EventAttendee, EventDetails, Organizer } from "@/lib/types";
import { resolveAssetUrl } from "@/lib/url";

type EventBundle = {
  details: EventDetails;
  organizer: Organizer | null;
  category: string | null;
  attendees: EventAttendee[];
};

export default function EventDetailsPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const res = useResource<EventBundle>(
    async (signal) => {
      const details = await getEventDetails(id!, signal);
      // Secondary, fail-soft enrichment in parallel.
      const [organizer, category, attendees] = await Promise.all([
        getOrganizer(id!, signal),
        getCategory(id!, signal),
        getEventAttendees(id!, signal),
      ]);
      return { details, organizer, category, attendees };
    },
    [id],
    { enabled: !!id },
  );

  if (res.status === "loading") {
    return <CenterMessage title="Loading event…" />;
  }

  if (res.status === "error") {
    const notFound =
      !!res.error &&
      typeof res.error === "object" &&
      "status" in res.error &&
      (res.error as { status?: number }).status === 404;
    return (
      <CenterMessage
        title="Something went wrong"
        subtitle={
          notFound
            ? "This event could not be found."
            : "Could not load this event. Is the API gateway running?"
        }
      />
    );
  }

  const { details, organizer, category, attendees } = res.data;

  if (!details?.event) {
    return <CenterMessage title="Event not found" />;
  }

  const ev = details.event;
  const venue = details.venue;
  const comments = details.comments ?? [];
  const registered = details.registeredUsersCount ?? 0;
  const location = venue?.name ?? ev.fullLocation;
  const city = venue?.city ?? null;

  return (
    <>
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
          <DiscussionCard comments={comments} eventId={ev.id} />
        </div>

        <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start">
          <EventStatusCard
            eventId={ev.id}
            registered={registered}
            capacity={ev.capacity}
            endDate={ev.endDate}
          />
          <AttendeesCard attendees={attendees} />
          <OrganizerCard organizer={organizer} organizerId={ev.organizerId} />
        </aside>
      </div>

      {/* One-time post-create toasts (?created / &imageFailed), then strip params. */}
      <Suspense fallback={null}>
        <FlashToast
          resolve={(p) => {
            if (p.get("created") !== "true") return null;
            return p.get("imageFailed") === "true"
              ? "Event created — but the cover image didn't upload. You can add it from this page."
              : "Event created";
          }}
          stripParams={["created", "imageFailed"]}
        />
      </Suspense>
    </>
  );
}
