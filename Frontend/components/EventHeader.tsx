import { Chip } from "./primitives";
import { CalendarIcon, MapPinIcon, UsersIcon } from "./icons";
import { formatDateRange, formatNumber } from "@/lib/format";

function Meta({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 py-4">
      <span className="mt-0.5 text-muted">{icon}</span>
      <div className="min-w-0">
        <div className="font-mono text-[11px] uppercase tracking-[0.05em] text-muted">
          {label}
        </div>
        <div className="mt-1 truncate text-sm text-on-surface">{value}</div>
      </div>
    </div>
  );
}

export function EventHeader({
  title,
  description,
  startDate,
  endDate,
  location,
  attendees,
  category,
  city,
}: {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  attendees: number;
  category: string | null;
  city: string | null;
}) {
  return (
    <div className="mx-auto max-w-[1200px] px-5 pt-8 sm:px-8 sm:pt-12">
      <div className="flex flex-wrap gap-2">
        {category && <Chip tone="accent">{category}</Chip>}
        {city && <Chip tone="outline">{city}</Chip>}
      </div>

      <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-[1.1] tracking-[var(--tracking-display)] sm:text-5xl">
        {title}
      </h1>

      {description && (
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-on-surface-variant">
          {description}
        </p>
      )}

      <div className="mt-6 grid grid-cols-1 gap-x-8 border-t border-white/[0.07] sm:grid-cols-3">
        <Meta
          icon={<CalendarIcon />}
          label="Date & Time"
          value={formatDateRange(startDate, endDate)}
        />
        <Meta icon={<MapPinIcon />} label="Location" value={location} />
        <Meta
          icon={<UsersIcon />}
          label="Attendance"
          value={`${formatNumber(attendees)} people attending`}
        />
      </div>
    </div>
  );
}
