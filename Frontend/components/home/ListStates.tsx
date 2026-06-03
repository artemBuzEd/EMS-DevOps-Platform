"use client";

import { SpinnerIcon } from "@/components/icons";
import { useAuth } from "@/lib/auth/useAuth";

// Grid of 6 card-shaped skeletons matching the real card dimensions. Same surface
// token as a real card (#1b1b1d) with a subtle pulse — not a centered spinner.
export function CardSkeletonGrid() {
  return (
    <ul
      aria-hidden
      className="grid-events-wide grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <li
          key={i}
          className="overflow-hidden rounded-[var(--radius-card)] border border-white/[0.08] bg-surface-low"
        >
          <div className="h-40 w-full animate-pulse bg-surface-container" />
          <div className="flex flex-col gap-3 p-6">
            <div className="h-6 w-3/4 animate-pulse rounded bg-surface-container" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-surface-container" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-surface-container" />
            <div className="h-4 w-full animate-pulse rounded bg-surface-container" />
          </div>
        </li>
      ))}
    </ul>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 px-6 text-center">
      {children}
    </div>
  );
}

// Search/filter returned 0 events: show the active filter summary + a clear CTA.
export function EmptyResults({
  summary,
  onClear,
}: {
  summary: string;
  onClear: () => void;
}) {
  return (
    <Center>
      <h2 className="text-2xl font-medium tracking-[-0.02em] text-on-surface">
        No events match your filters
      </h2>
      <p className="max-w-md text-sm text-muted">{summary}</p>
      <button
        type="button"
        onClick={onClear}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-on-primary transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo"
      >
        Clear filters
      </button>
    </Center>
  );
}

// No events in the system at all (no filters applied). Admins/organizers get a CTA
// to create one; anonymous visitors just get the message.
export function InitialEmpty() {
  const { user } = useAuth();
  const canCreate =
    !!user &&
    (user.roles.includes("organizer") || user.roles.includes("admin"));

  return (
    <Center>
      <h2 className="text-2xl font-medium tracking-[-0.02em] text-on-surface">
        No events yet
      </h2>
      <p className="max-w-md text-sm text-muted">
        Once events are published they’ll show up here.
      </p>
      {canCreate ? (
        <a
          href="/events/new"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-on-primary transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo"
        >
          Create an event
        </a>
      ) : null}
    </Center>
  );
}

// 5xx / network failure: an inline error card with a retry that re-runs the same
// filter combination (not a toast, not a full-page replacement).
export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="mt-6 rounded-[var(--radius-card)] border border-error/30 bg-error-container/10 p-6">
      <h2 className="text-base font-medium text-on-surface">
        Couldn’t load events
      </h2>
      <p className="mt-1 text-sm text-muted">
        Something went wrong reaching the server. Check your connection and try
        again.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 inline-flex items-center gap-2 rounded-md border border-white/[0.12] bg-surface-low px-4 py-2 text-sm font-medium text-on-surface transition-colors hover:border-white/[0.22] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo"
      >
        <SpinnerIcon width={15} height={15} />
        Retry
      </button>
    </div>
  );
}
