"use client";

import Link from "next/link";
import { UserHeader } from "@/components/UserHeader";
import { CalendarCard } from "@/components/CalendarCard";
import { ActivityRow } from "@/components/ActivityRow";
import { CenterMessage } from "@/components/AppShell";
import { ApiError, getUserDashboard } from "@/lib/api";
import { useResource } from "@/lib/useResource";
import type { UserDashboardResponse } from "@/lib/types";

export default function DashboardPage() {
  // RequireAuth (authed layout) guarantees a signed-in user before this mounts,
  // and the dashboard is always the caller's own — the aggregator reads the user
  // from the token, so no id is needed.
  const res = useResource<UserDashboardResponse>(
    (signal) => getUserDashboard(signal),
    [],
  );

  if (res.status === "loading") {
    return <DashboardSkeleton />;
  }

  if (res.status === "error") {
    const notFound = res.error instanceof ApiError && res.error.status === 404;
    return (
      <CenterMessage
        title={notFound ? "Dashboard not found" : "Couldn't load your dashboard"}
        subtitle={
          notFound
            ? "We couldn't load your profile yet. Try again shortly."
            : "The dashboard service is unavailable. Is the API gateway running?"
        }
      />
    );
  }

  const { user, myCalendars, myComments } = res.data;
  const calendars = myCalendars ?? [];
  // Recent Activity is newest-first.
  const comments = [...(myComments ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <>
      <UserHeader user={user} />

      <section
        aria-labelledby="my-calendars"
        className="mx-auto mt-16 max-w-[1200px] px-5 sm:px-8"
      >
        <h2
          id="my-calendars"
          className="text-[32px] font-semibold tracking-[-0.03em] text-on-surface"
        >
          My Calendars
        </h2>
        {calendars.length === 0 ? (
          <EmptyState
            title="You haven't joined any events yet"
            body="Browse upcoming events and add them to your calendar to see them here."
            cta={{ href: "/", label: "Explore events" }}
          />
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {calendars.map((c) => (
              <CalendarCard key={c.calendarId} calendar={c} />
            ))}
          </div>
        )}
      </section>

      <section
        aria-labelledby="recent-activity"
        className="mx-auto mt-16 max-w-[1200px] px-5 pb-16 sm:px-8"
      >
        <h2
          id="recent-activity"
          className="text-[32px] font-semibold tracking-[-0.03em] text-on-surface"
        >
          Recent Activity
        </h2>
        {comments.length === 0 ? (
          <EmptyState
            title="No activity yet"
            body="Your comments and ratings on events will show up here."
          />
        ) : (
          <div className="mt-6 space-y-4">
            {comments.map((c) => (
              <ActivityRow key={c.commentId} comment={c} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function EmptyState({
  title,
  body,
  cta,
}: {
  title: string;
  body: string;
  cta?: { href: string; label: string };
}) {
  return (
    <div className="mt-6 flex flex-col items-center rounded-[var(--radius-card)] border border-dashed border-white/[0.12] bg-surface-lowest px-6 py-14 text-center">
      <p className="text-lg font-semibold tracking-[-0.01em] text-on-surface">
        {title}
      </p>
      <p className="mt-2 max-w-sm text-sm text-on-surface-variant">{body}</p>
      {cta && (
        <Link
          href={cta.href}
          className="mt-6 rounded bg-primary px-4 py-2 text-sm font-medium text-on-primary transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo"
        >
          {cta.label}
        </Link>
      )}
    </div>
  );
}

// Skeleton built from the real card surfaces (card-glow / flat Level-1 border)
// so loading reads as the page filling in, not a generic gray block.
function DashboardSkeleton() {
  return (
    <div
      className="mx-auto max-w-[1200px] px-5 pt-16 sm:px-8"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Loading dashboard…</span>

      <div className="flex items-center gap-5">
        <div className="h-16 w-16 animate-pulse rounded-full bg-white/[0.06]" />
        <div className="h-10 w-64 animate-pulse rounded bg-white/[0.06]" />
      </div>
      <div className="mt-6 h-4 w-[480px] max-w-full animate-pulse rounded bg-white/[0.05]" />

      <div className="mt-12 h-8 w-48 animate-pulse rounded bg-white/[0.06]" />
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="card-glow h-40 animate-pulse rounded-[var(--radius-card)]"
          />
        ))}
      </div>

      <div className="mt-12 h-8 w-48 animate-pulse rounded bg-white/[0.06]" />
      <div className="mt-6 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-[var(--radius-card)] border border-white/[0.07] bg-surface-lowest"
          />
        ))}
      </div>
    </div>
  );
}
