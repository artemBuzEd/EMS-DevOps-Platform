"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CreateEventForm } from "@/components/events/create/CreateEventForm";
import { getAllVenues, getCategories } from "@/lib/api";
import { useAuth } from "@/lib/auth/useAuth";
import { useResource } from "@/lib/useResource";
import { useUnsavedChangesWarning } from "@/lib/navGuard";
import type { Venue } from "@/lib/types";

// Categories are fetched alongside venues so the form fails as a unit if either
// endpoint is down, matching the previous load-gate behavior.
type FormData = { venues: Venue[]; categories: string[] };

export default function CreateEventPage() {
  // RequireAuth (authed layout) guarantees a signed-in user; `user` is authoritative.
  const { user } = useAuth();
  const router = useRouter();

  // Only organizers/admins can create events (mirrors the CanCreateEvent policy).
  const canCreate =
    !!user &&
    (user.roles.includes("organizer") || user.roles.includes("admin"));

  const [isDirty, setIsDirty] = useState(false);
  const onDirtyChange = useCallback((dirty: boolean) => setIsDirty(dirty), []);

  useUnsavedChangesWarning(isDirty, "Discard event? Your changes will be lost.");

  // Signed in but lacking the role → hard bounce to the events catalog with a
  // one-time toast. (Not `/` — that redirects a signed-in user to their
  // dashboard, where this toast wouldn't show.) The form never renders for them.
  useEffect(() => {
    if (user && !canCreate) {
      router.replace("/events?denied=create-event");
    }
  }, [user, canCreate, router]);

  // Load venues + categories once the user is authorized.
  const res = useResource<FormData>(
    async (signal) => {
      const [venues, categories] = await Promise.all([
        getAllVenues(signal),
        getCategories(signal),
      ]);
      return { venues, categories };
    },
    [],
    { enabled: canCreate },
  );

  let body: React.ReactNode = null;
  if (!canCreate) {
    body = <p className="mt-10 text-sm text-on-surface-variant">Redirecting…</p>;
  } else if (res.status === "loading") {
    body = <CreateEventSkeleton />;
  } else if (res.status === "error") {
    body = (
      <div className="mt-10">
        <h2 className="text-lg font-semibold text-on-surface">
          Couldn&apos;t load the form
        </h2>
        <p className="mt-2 text-sm text-on-surface-variant">
          We couldn&apos;t load venues or categories. Is the API gateway running?
        </p>
        <button
          type="button"
          onClick={res.retry}
          className="mt-4 rounded border border-white/[0.12] px-4 py-2 text-sm text-on-surface transition-colors hover:border-white/[0.22]"
        >
          Try again
        </button>
      </div>
    );
  } else {
    body = (
      <CreateEventForm venues={res.data.venues} onDirtyChange={onDirtyChange} />
    );
  }

  return (
    <div className="mx-auto max-w-[880px] px-5 py-16 sm:px-8">
      <header className="border-b border-white/[0.07] pb-6">
        <h1 className="text-[32px] font-semibold tracking-[-0.03em] text-on-surface">
          Create Event
        </h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          Fill in the details and select a venue. You can edit everything after
          publishing.
        </p>
      </header>
      {body}
    </div>
  );
}

// Skeleton mirrors the four form sections (not a centered spinner).
function CreateEventSkeleton() {
  return (
    <div className="mt-8 space-y-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading the create-event form…</span>
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="card-glow rounded-[var(--radius-card)] p-6 sm:p-8"
        >
          <div className="h-6 w-48 animate-pulse rounded bg-white/[0.06]" />
          <div className="mt-2 h-4 w-72 animate-pulse rounded bg-white/[0.04]" />
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="h-11 animate-pulse rounded bg-white/[0.05]" />
            <div className="h-11 animate-pulse rounded bg-white/[0.05]" />
            <div className="h-28 animate-pulse rounded bg-white/[0.05] sm:col-span-2" />
          </div>
        </div>
      ))}
    </div>
  );
}
