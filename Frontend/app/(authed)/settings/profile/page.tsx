"use client";

import { useCallback, useState } from "react";
import { AvatarSettings } from "@/components/profile/AvatarSettings";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { ApiError, getUserProfile } from "@/lib/api";
import { formatShortDate } from "@/lib/format";
import { useAuth } from "@/lib/auth/useAuth";
import { useResource } from "@/lib/useResource";
import { useUnsavedChangesWarning } from "@/lib/navGuard";
import type { UserProfileResponse } from "@/lib/types";

export default function ProfileSettingsPage() {
  // RequireAuth (authed layout) guarantees a signed-in user before this mounts.
  // userId is ALWAYS the token's sub — never a URL/prop/storage.
  const { user } = useAuth();
  const [isDirty, setIsDirty] = useState(false);
  const onDirtyChange = useCallback((dirty: boolean) => setIsDirty(dirty), []);

  // Warn on tab close and on in-app navigation while there are unsaved edits.
  useUnsavedChangesWarning(
    isDirty,
    "You have unsaved changes. Leave without saving?",
  );

  const res = useResource<UserProfileResponse>(
    (signal) => getUserProfile(user!.sub, signal),
    [user?.sub],
    { enabled: !!user },
  );

  let body: React.ReactNode = null;
  if (res.status === "loading") {
    body = <ProfileSkeleton />;
  } else if (res.status === "error") {
    const notFound = res.error instanceof ApiError && res.error.status === 404;
    body = (
      <div className="mt-10">
        <h2 className="text-lg font-semibold text-on-surface">
          {notFound ? "Profile not found" : "Couldn't load your profile"}
        </h2>
        <p className="mt-2 text-sm text-on-surface-variant">
          {notFound
            ? "We couldn't load your profile. Try again shortly."
            : "The profile service is unavailable. Is the API gateway running?"}
        </p>
      </div>
    );
  } else if (user) {
    body = (
      <Ready
        profile={res.data}
        userId={user.sub}
        onDirtyChange={onDirtyChange}
      />
    );
  }

  return (
    <div className="mx-auto max-w-[880px] px-5 py-16 sm:px-8">
      <header className="border-b border-white/[0.07] pb-6">
        <h1 className="text-[32px] font-semibold tracking-[-0.03em] text-on-surface">
          Edit Profile
        </h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          Update your name, bio, and profile photo.
        </p>
      </header>
      {body}
    </div>
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
