import { AppShell } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { NavGuardProvider } from "@/lib/navGuard";

// Authed pages (dashboard, profile, create event). One place owns the sign-in
// gate (so every protected page behaves the same) and the nav guard provider
// (installed above the Navbar so unsaved-changes prompts can intercept it).
export default function AuthedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NavGuardProvider>
      <AppShell>
        <RequireAuth>{children}</RequireAuth>
      </AppShell>
    </NavGuardProvider>
  );
}
