"use client";

import { useCallback, useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AvatarSettings } from "@/components/profile/AvatarSettings";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { NavGuardContext } from "@/components/profile/navGuard";
import { ApiError, getUserProfile } from "@/lib/api";
import { formatShortDate } from "@/lib/format";
import { useAuth } from "@/lib/auth/useAuth";
import type { UserProfileResponse } from "@/lib/types";

type State =
  | { kind: "anonymous" }
  | { kind: "loading" }
  | { kind: "error"; title: string; message: string }
  | { kind: "ready"; profile: UserProfileResponse };

export default function ProfileSettingsPage() {
  // AuthProvider gates rendering until keycloak.init() resolves, so `authenticated`
  // is authoritative here. userId is ALWAYS the token's sub — never a URL/prop/storage.
  const { authenticated, user, login } = useAuth();
  const [state, setState] = useState<State>(
    authenticated ? { kind: "loading" } : { kind: "anonymous" },
  );
  const [isDirty, setIsDirty] = useState(false);

  const onDirtyChange = useCallback((dirty: boolean) => setIsDirty(dirty), []);

  // Anonymous visitors are redirected to login.
  useEffect(() => {
    if (!authenticated) {
      login({ redirectUri: window.location.href });
    }
  }, [authenticated, login]);

  useEffect(() => {
    if (!authenticated || !user) return;

    const controller = new AbortController();
    setState({ kind: "loading" });

    (async () => {
      try {
        const profile = await getUserProfile(user.sub, controller.signal);
        setState({ kind: "ready", profile });
      } catch (err) {
        if (controller.signal.aborted) return;
        if (err instanceof ApiError && err.status === 404) {
          setState({
            kind: "error",
            title: "Profile not found",
            message: "We couldn't load your profile. Try again shortly.",
          });
        } else {
          setState({
            kind: "error",
            title: "Couldn't load your profile",
            message: "The profile service is unavailable. Is the API gateway running?",
          });
        }
      }
    })();

    return () => controller.abort();
  }, [authenticated, user]);

  // Native prompt on tab close / refresh / external nav while there are unsaved edits.
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // Consulted by the Navbar before it navigates away (in-app nav guard).
  const confirmLeave = useCallback(
    () =>
      !isDirty ||
      window.confirm("You have unsaved changes. Leave without saving?"),
    [isDirty],
  );

  return (
    <NavGuardContext.Provider value={confirmLeave}>
      <div className="min-h-screen">
        <Navbar />
        <main className="mx-auto max-w-[880px] px-5 py-16 sm:px-8">
          <header className="border-b border-white/[0.07] pb-6">
            <h1 className="text-[32px] font-semibold tracking-[-0.03em] text-on-surface">
              Edit Profile
            </h1>
            <p className="mt-2 text-sm text-on-surface-variant">
              Update your name, bio, and profile photo.
            </p>
          </header>

          {state.kind === "loading" && <ProfileSkeleton />}
          {state.kind === "anonymous" && (
            <p className="mt-10 text-sm text-on-surface-variant">
              Redirecting to sign in…
            </p>
          )}
          {state.kind === "error" && (
            <div className="mt-10">
              <h2 className="text-lg font-semibold text-on-surface">{state.title}</h2>
              <p className="mt-2 text-sm text-on-surface-variant">{state.message}</p>
            </div>
          )}

          {state.kind === "ready" && user && (
            <Ready profile={state.profile} userId={user.sub} onDirtyChange={onDirtyChange} />
          )}
        </main>
        <Footer />
      </div>
    </NavGuardContext.Provider>
  );
}

function Ready({
  profile,
  userId,
  onDirtyChange,
}: {
  profile: UserProfileResponse;
  userId: string;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const initials =
    `${profile.first_name?.[0] ?? ""}${profile.last_name?.[0] ?? ""}`.toUpperCase() ||
    "?";

  return (
    <div className="mt-8 space-y-6">
      <AvatarSettings
        userId={userId}
        initialAvatarUrl={profile.avatar_url}
        initials={initials}
      />

      <p className="font-mono text-[12px] font-medium uppercase tracking-[0.05em] text-white/60">
        Created {formatShortDate(profile.created_at)}
      </p>

      <ProfileForm userId={userId} profile={profile} onDirtyChange={onDirtyChange} />
    </div>
  );
}

// Skeleton mirrors the real layout: avatar circle, two field rows, textarea.
function ProfileSkeleton() {
  return (
    <div className="mt-8 space-y-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading your profile…</span>

      <div className="card-glow rounded-[var(--radius-card)] p-6 sm:p-8">
        <div className="flex items-center gap-6">
          <div className="h-24 w-24 animate-pulse rounded-full bg-white/[0.06]" />
          <div className="flex-1 space-y-3">
            <div className="h-5 w-40 animate-pulse rounded bg-white/[0.06]" />
            <div className="h-9 w-48 animate-pulse rounded bg-white/[0.05]" />
          </div>
        </div>
      </div>

      <div className="card-glow rounded-[var(--radius-card)] p-6 sm:p-8">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="h-12 animate-pulse rounded bg-white/[0.05]" />
          <div className="h-12 animate-pulse rounded bg-white/[0.05]" />
          <div className="h-28 animate-pulse rounded bg-white/[0.05] sm:col-span-2" />
          <div className="h-12 w-64 animate-pulse rounded bg-white/[0.05] sm:col-span-2" />
        </div>
      </div>
    </div>
  );
}
