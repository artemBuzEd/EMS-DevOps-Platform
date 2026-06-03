"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { UserHeader } from "@/components/UserHeader";
import { CalendarCard } from "@/components/CalendarCard";
import { ActivityRow } from "@/components/ActivityRow";
import { ApiError, getUserDashboard } from "@/lib/api";
import { useAuth } from "@/lib/auth/useAuth";
import type { UserDashboardResponse } from "@/lib/types";

type State =
  | { kind: "anonymous" }
  | { kind: "loading" }
  | { kind: "error"; title: string; message: string }
  | { kind: "ready"; data: UserDashboardResponse };

export default function DashboardPage() {
  // AuthProvider gates rendering until keycloak.init() resolves, so by the time
  // this renders `authenticated` is authoritative. The dashboard is always the
  // caller's own — the aggregator reads the user from the token, no id needed.
  const { authenticated, login } = useAuth();
  const [state, setState] = useState<State>(
    authenticated ? { kind: "loading" } : { kind: "anonymous" },
  );

  useEffect(() => {
    if (!authenticated) {
      setState({ kind: "anonymous" });
      return;
    }

    const controller = new AbortController();
    setState({ kind: "loading" });

    (async () => {
      try {
        const data = await getUserDashboard(controller.signal);
        setState({ kind: "ready", data });
      } catch (err) {
        if (controller.signal.aborted) return;
        if (err instanceof ApiError && err.status === 404) {
          setState({
            kind: "error",
            title: "Dashboard not found",
            message: "We couldn't load your profile yet. Try again shortly.",
          });
        } else {
          setState({
            kind: "error",
            title: "Couldn't load your dashboard",
            message:
              "The dashboard service is unavailable. Is the API gateway running?",
          });
        }
      }
    })();

    return () => controller.abort();
  }, [authenticated]);

  if (state.kind === "anonymous") {
    return (
      <Shell>
        <CenterMessage
          title="Sign in to view your dashboard"
          subtitle="Your calendars and recent activity live here once you're signed in."
          action={
            <button
              onClick={() => login({ redirectUri: window.location.href })}
              className="mt-6 rounded bg-primary px-4 py-2 text-sm font-medium text-on-primary transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo"
            >
              Sign in
            </button>
          }
        />
      </Shell>
    );
  }

  if (state.kind === "loading") {
    return (
      <Shell>
        <DashboardSkeleton />
      </Shell>
    );
  }

  if (state.kind === "error") {
    return (
      <Shell>
        <CenterMessage title={state.title} subtitle={state.message} />
      </Shell>
    );
  }

  const { user, myCalendars, myComments } = state.data;
  const calendars = myCalendars ?? [];
  // Recent Activity is newest-first.
  const comments = [...(myComments ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <Shell>
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

function CenterMessage({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-center px-5 py-32 text-center">
      <h1 className="text-2xl font-semibold tracking-[-0.02em]">{title}</h1>
      {subtitle && (
        <p className="mt-2 max-w-md text-sm text-on-surface-variant">{subtitle}</p>
      )}
      {action}
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
