import Link from "next/link";
import { CalendarIcon, MapPinIcon, UsersIcon } from "@/components/icons";
import { formatDateRange, formatNumber } from "@/lib/format";
import { resolveAssetUrl } from "@/lib/url";
import type { EventListItem } from "@/lib/types";

// A single clickable region: the whole card is an <a> (correct middle-click /
// Cmd-click / screen-reader behaviour) — not a div with onClick. Fixed height so
// the grid stays predictable regardless of title/description length. Hover lifts
// via border brightness only (0.08 → 0.18), no shadow, no scale (DESIGN.md).
export function EventCard({ event }: { event: EventListItem }) {
  const img = resolveAssetUrl(event.pictureUrl);

  return (
    <Link
      href={`/events/${event.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-white/[0.08] bg-surface-low transition-colors hover:border-white/[0.18] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div className="relative h-40 w-full overflow-hidden bg-surface-container">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          // Gradient block (NOT a gray "broken image" placeholder) when an event
          // has no picture — keeps the grid visually consistent.
          <div className="h-full w-full bg-gradient-to-br from-surface-high via-surface-container to-black" />
        )}
        {event.categoryName ? (
          <span className="absolute left-3 top-3 rounded-full border border-indigo/40 bg-indigo/15 px-2.5 py-1 text-[11px] font-medium tracking-[0.02em] text-secondary backdrop-blur-sm">
            {event.categoryName}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-6">
        <h3 className="line-clamp-2 text-2xl font-medium leading-tight tracking-[-0.02em] text-on-surface">
          {event.title}
        </h3>

        <div className="flex items-center gap-2 text-sm text-on-surface-variant">
          <CalendarIcon width={15} height={15} className="shrink-0 text-muted" />
          <span className="truncate">
            {formatDateRange(event.startDate, event.endDate)}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm text-on-surface-variant">
          <MapPinIcon width={15} height={15} className="shrink-0 text-muted" />
          <span className="truncate">{event.fullLocation}</span>
        </div>

        <p className="line-clamp-2 text-sm leading-relaxed text-muted">
          {event.description}
        </p>

        <div className="mt-auto flex items-center gap-2 border-t border-white/[0.06] pt-3 text-xs text-muted">
          <UsersIcon width={14} height={14} className="shrink-0" />
          <span>Capacity: {formatNumber(event.capacity)}</span>
        </div>
      </div>
    </Link>
  );
}
