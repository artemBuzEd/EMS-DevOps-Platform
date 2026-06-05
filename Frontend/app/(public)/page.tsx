"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/useAuth";
import { EventsCatalog } from "@/components/home/EventsCatalog";

// Root dispatcher. A signed-in user's home is their dashboard; a signed-out
// visitor's home is the public events catalog, rendered right here (no redirect,
// so the catalog truly lives at `/` for them).
//
// `authenticated` is authoritative on first render — AuthProvider holds a splash
// until keycloak.init() resolves, before any page mounts — so there's no flash
// of the wrong view either way, and the authed branch never mounts the catalog.
export default function HomePage() {
  const { authenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authenticated) router.replace("/dashboard");
  }, [authenticated, router]);

  if (authenticated) return null; // about to redirect to /dashboard

  return <EventsCatalog />;
}
