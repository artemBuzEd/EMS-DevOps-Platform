import type { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

/**
 * The page chrome — sticky Navbar, a `<main>` landmark, and the Footer. Rendered
 * once per route-group layout so individual pages never re-declare it. Pages set
 * their own inner width (e.g. a `max-w-[1200px]` section or a `max-w-[880px]`
 * container); `<main>` stays unstyled so both layouts can share it.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
}

/**
 * Centered single-message view for empty/loading/error/sign-in screens. Used by
 * the auth gate and by pages that can't render their normal content.
 */
export function CenterMessage({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
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
