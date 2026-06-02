import Link from "next/link";
import { BellIcon, SearchIcon, SettingsIcon } from "./icons";

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
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo to-secondary-container" />
        </div>
      </div>
    </header>
  );
}
