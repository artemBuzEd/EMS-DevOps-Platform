"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth/useAuth";
import { CenterMessage } from "./AppShell";

/**
 * Gate for the authed route group. AuthProvider has already resolved the SSO
 * session by the time this renders, so `authenticated` is authoritative — when
 * signed out we show one consistent sign-in prompt (no surprise redirect to
 * Keycloak), and the page below never mounts until the user is signed in.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { authenticated, login } = useAuth();

  if (!authenticated) {
    return (
      <CenterMessage
        title="Sign in to continue"
        subtitle="You need to be signed in to view this page."
        action={
          <button
            onClick={() => login({ redirectUri: window.location.href })}
            className="mt-6 rounded bg-primary px-4 py-2 text-sm font-medium text-on-primary transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo"
          >
            Sign in
          </button>
        }
      />
    );
  }

  return <>{children}</>;
}
