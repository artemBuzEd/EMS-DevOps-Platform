import { FlagIcon } from "./icons";
import type { Organizer } from "@/lib/types";

export function OrganizerCard({
  organizer,
  organizerId,
}: {
  organizer: Organizer | null;
  organizerId: string;
}) {
  const name =
    organizer && (organizer.first_name || organizer.last_name)
      ? `${organizer.first_name} ${organizer.last_name}`.trim()
      : `Organizer ${organizerId.slice(0, 6)}`;

  return (
    <section className="rounded-[var(--radius-card)] border border-white/[0.07] bg-surface-low p-6">
      <div className="font-mono text-[11px] uppercase tracking-[0.05em] text-muted">
        Organizer
      </div>
      <div className="mt-3 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-secondary-container to-indigo text-on-surface">
          <FlagIcon width={18} height={18} />
        </span>
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-on-surface">
            {name}
          </div>
          <span className="cursor-pointer text-xs text-secondary hover:text-on-surface">
            View Profile
          </span>
        </div>
      </div>
    </section>
  );
}
