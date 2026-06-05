import { AppShell } from "@/components/AppShell";

// Public pages (home, event details) — chrome only, no auth gate.
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
