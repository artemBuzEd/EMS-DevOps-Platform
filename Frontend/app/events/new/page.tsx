"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { NavGuardContext } from "@/components/profile/navGuard";
import { CreateEventForm } from "@/components/events/create/CreateEventForm";
import { getAllVenues, getCategories } from "@/lib/api";
import { useAuth } from "@/lib/auth/useAuth";
import type { Venue } from "@/lib/types";

type State =
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "ready"; venues: Venue[]; categories: string[] };

export default function CreateEventPage() {
  // AuthProvider gates rendering until keycloak.init() resolves, so `authenticated`
  // and `user` are authoritative here.
  const { authenticated, user, login } = useAuth();
  const router = useRouter();

  const canCreate =
    !!user &&
    (user.roles.includes("organizer") || user.roles.includes("admin"));

  const [state, setState] = useState<State>({ kind: "loading" });
  const [reloadKey, setReloadKey] = useState(0);
  const [isDirty, setIsDirty] = useState(false);

  const onDirtyChange = useCallback((dirty: boolean) => setIsDirty(dirty), []);

  // Anonymous visitors are sent to login.
  useEffect(() => {
    if (!authenticated) {
      login({ redirectUri: window.location.href });
    }
  }, [authenticated, login]);

  // Authenticated but lacking the CanCreateEvent role → hard bounce to the
  // listing with a one-time toast. The page never renders the form for them.
  useEffect(() => {
    if (authenticated && user && !canCreate) {
      router.replace("/?denied=create-event");
    }
  }, [authenticated, user, canCreate, router]);

  // Load venues + categories in parallel once the user is authorized.
  useEffect(() => {
    if (!authenticated || !canCreate) return;

    const controller = new AbortController();
    setState({ kind: "loading" });

    (async () => {
      try {
        const [venues, categories] = await Promise.all([
          getAllVenues(controller.signal),
          getCategories(controller.signal),
        ]);
        setState({ kind: "ready", venues, categories });
      } catch {
        if (controller.signal.aborted) return;
        setState({ kind: "error" });
      }
    })();

    return () => controller.abort();
  }, [authenticated, canCreate, reloadKey]);

  // Native prompt on tab close / refresh while there are unsaved edits.
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // Consulted by the Navbar before in-app navigation.
  const confirmLeave = useCallback(
    () => !isDirty || window.confirm("Discard event? Your changes will be lost."),
    [isDirty],
  );

  return (
    <NavGuardContext.Provider value={confirmLeave}>
      <div className="min-h-screen">
        <Navbar />
        <main className="mx-auto max-w-[880px] px-5 py-16 sm:px-8">
          <header className="border-b border-white/[0.07] pb-6">
            <h1 className="text-[32px] font-semibold tracking-[-0.03em] text-on-surface">
              Create Event
            </h1>
            <p className="mt-2 text-sm text-on-surface-variant">
              Fill in the details and select a venue. You can edit everything
              after publishing.
            </p>
          </header>

          {!authenticated && (
            <p className="mt-10 text-sm text-on-surface-variant">
              Redirecting to sign in…
            </p>
          )}

          {authenticated && !canCreate && (
            <p className="mt-10 text-sm text-on-surface-variant">Redirecting…</p>
          )}

          {authenticated && canCreate && state.kind === "loading" && (
            <CreateEventSkeleton />
          )}

          {authenticated && canCreate && state.kind === "error" && (
            <div className="mt-10">
              <h2 className="text-lg font-semibold text-on-surface">
                Couldn&apos;t load the form
              </h2>
              <p className="mt-2 text-sm text-on-surface-variant">
                We couldn&apos;t load venues or categories. Is the API gateway
                running?
              </p>
              <button
                type="button"
                onClick={() => setReloadKey((k) => k + 1)}
                className="mt-4 rounded border border-white/[0.12] px-4 py-2 text-sm text-on-surface transition-colors hover:border-white/[0.22]"
              >
                Try again
              </button>
            </div>
          )}

          {authenticated && canCreate && state.kind === "ready" && (
            <CreateEventForm
              venues={state.venues}
              categories={state.categories}
              onDirtyChange={onDirtyChange}
            />
          )}
        </main>
        <Footer />
      </div>
    </NavGuardContext.Provider>
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
