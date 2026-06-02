import Link from "next/link";
import type { UserCalendar } from "@/lib/types";
import { formatCalendarRange } from "@/lib/format";
import { CalendarIcon, VenueIcon } from "./icons";
import { StatusPill } from "./StatusPill";

export function CalendarCard({ calendar }: { calendar: UserCalendar }) {
  const completed = (calendar.status ?? "").trim().toLowerCase() === "completed";
  const Icon = completed ? VenueIcon : CalendarIcon;
  const hasTitle = Boolean(calendar.eventTitle);

  return (
    <article>
      <Link
        href={`/events/${encodeURIComponent(calendar.eventId)}`}
        className="card-glow card-glow-hover block rounded-[var(--radius-card)] p-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo"
      >
        <div className="flex items-start justify-between gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-white/[0.03] text-on-surface-variant">
            <Icon width={18} height={18} aria-hidden="true" />
          </span>
          <StatusPill status={calendar.status} eventTitle={calendar.eventTitle} />
        </div>

        <h3
          className={`mt-4 line-clamp-2 text-lg font-semibold leading-snug tracking-[-0.01em] ${
            hasTitle ? "text-on-surface" : "italic text-muted"
          }`}
        >
          {hasTitle ? calendar.eventTitle : "Event unavailable"}
        </h3>

        <p className="mt-1 text-sm text-on-surface-variant">
          {formatCalendarRange(calendar.startDate, calendar.endDate)}
        </p>

        <div className="my-4 border-t border-white/[0.07]" />

        <p className="font-mono text-[11px] uppercase tracking-[0.05em] text-muted">
          Added on {formatCalendarRange(calendar.addedAt, null)}
        </p>
      </Link>
    </article>
  );
}
