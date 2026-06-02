import type { UserProfile } from "@/lib/types";
import { initial } from "@/lib/format";
import { LockIcon } from "./icons";

const bornFmt = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

function formatBorn(iso: string): string | null {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : bornFmt.format(d);
}

export function UserHeader({ user }: { user: UserProfile }) {
  const fullName = [user.first_name, user.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  const born = formatBorn(user.birth_date);

  return (
    <header className="mx-auto max-w-[1200px] px-5 pt-16 sm:px-8">
      <div className="flex items-center gap-5">
        <div
          aria-hidden="true"
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo to-secondary-container text-2xl font-semibold text-on-surface"
        >
          {initial(fullName || user.user_id)}
        </div>
        {/* Display headline: 56px desktop, scales to 32px on mobile, keeps the
            -0.04em tracking (DESIGN.md). */}
        <h1 className="text-[32px] font-semibold leading-[1.1] tracking-[-0.04em] text-on-surface md:text-[56px]">
          {fullName || "Member"}
        </h1>
      </div>

      {user.bio && (
        <p className="mt-6 max-w-[680px] text-[16px] leading-[1.6] text-on-surface-variant">
          {user.bio}
        </p>
      )}

      {born && (
        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-[12px] tracking-[0.02em] text-on-surface-variant">
          <LockIcon aria-hidden="true" width={13} height={13} className="text-muted" />
          <span>Born {born}</span>
        </div>
      )}
    </header>
  );
}
