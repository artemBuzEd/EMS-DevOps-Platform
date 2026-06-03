"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BellIcon, SearchIcon, SettingsIcon } from "./icons";
import { useAuth } from "@/lib/auth/useAuth";

const NAV = ["Events", "Venues", "Schedule", "Resources"];

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.07] bg-surface/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-[1200px] items-center gap-6 px-5 sm:px-8">
        <Link href="/" className="text-base font-semibold tracking-[-0.02em]">
          EventPro
        </Link>

        <nav className="hidden items-center gap-5 md:flex">
          {NAV.map((item, i) => (
            <span
              key={item}
              className={`text-sm ${
                i === 0
                  ? "text-on-surface"
                  : "text-on-surface-variant hover:text-on-surface"
              } cursor-pointer transition-colors`}
            >
              {item}
            </span>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-md border border-white/10 bg-surface-low px-3 py-1.5 sm:flex">
            <SearchIcon className="text-muted" width={15} height={15} />
            <span className="text-xs text-muted">Search...</span>
          </div>
          <button
            aria-label="Notifications"
            className="text-on-surface-variant transition-colors hover:text-on-surface"
          >
            <BellIcon />
          </button>
          <button
            aria-label="Settings"
            className="text-on-surface-variant transition-colors hover:text-on-surface"
          >
            <SettingsIcon />
          </button>
          <AuthControl />
        </div>
      </div>
    </header>
  );
}

// Sign-in button when signed out; avatar + dropdown menu when signed in.
function AuthControl() {
  const { authenticated, user, login, logout } = useAuth();

  if (!authenticated || !user) {
    return (
      <button
        onClick={() => login({ redirectUri: window.location.href })}
        className="rounded bg-primary px-4 py-1.5 text-sm font-medium text-on-primary transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo"
      >
        Sign in
      </button>
    );
  }

  return <UserMenu name={user.name} initials={user.initials} logout={logout} />;
}

function UserMenu({
  name,
  initials,
  logout,
}: {
  name: string;
  initials: string;
  logout: ReturnType<typeof useAuth>["logout"];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo to-secondary-container text-[11px] font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo"
      >
        {initials}
      </button>

      {open && (
        <div
          role="menu"
          className="card-glow absolute right-0 mt-2 w-56 overflow-hidden rounded-[var(--radius-card)] py-1 shadow-xl"
        >
          <div className="border-b border-white/[0.07] px-4 py-3">
            <p className="truncate text-sm font-medium text-on-surface">{name}</p>
          </div>
          <Link
            href="/dashboard"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm text-on-surface-variant transition-colors hover:bg-white/[0.04] hover:text-on-surface"
          >
            Dashboard
          </Link>
          <button
            role="menuitem"
            onClick={() => logout({ redirectUri: window.location.origin })}
            className="block w-full px-4 py-2 text-left text-sm text-on-surface-variant transition-colors hover:bg-white/[0.04] hover:text-on-surface"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
