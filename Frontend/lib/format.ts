const UK = "uk-UA";

const dateFmt = new Intl.DateTimeFormat(UK, {
  day: "numeric",
  month: "long",
  year: "numeric",
});
const timeFmt = new Intl.DateTimeFormat(UK, {
  hour: "2-digit",
  minute: "2-digit",
});

/** "31 травня 2026, 11:00 - 20:00" (or single time if same day omitted-end). */
export function formatDateRange(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  if (isNaN(start.getTime())) return "";
  const datePart = dateFmt.format(start);
  const startTime = timeFmt.format(start);
  if (isNaN(end.getTime())) return `${datePart}, ${startTime}`;

  const sameDay = start.toDateString() === end.toDateString();
  if (sameDay) {
    return `${datePart}, ${startTime} - ${timeFmt.format(end)}`;
  }
  return `${datePart}, ${startTime} - ${dateFmt.format(end)}, ${timeFmt.format(end)}`;
}

/** Thousands-separated integer, e.g. 1240 -> "1,240". */
export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

/** Relative time like "2 hours ago", "5 hours ago", "3 days ago". */
export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (isNaN(then)) return "";
  const diffMs = Date.now() - then;
  const sec = Math.round(diffMs / 1000);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31536000],
    ["month", 2592000],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [unit, secs] of units) {
    if (Math.abs(sec) >= secs) {
      return rtf.format(-Math.round(sec / secs), unit);
    }
  }
  return rtf.format(-sec, "second");
}

/** Single uppercase initial for an avatar, derived from an id/name string. */
export function initial(value: string | null | undefined): string {
  if (!value) return "?";
  const ch = value.trim()[0];
  return ch ? ch.toUpperCase() : "?";
}

/** Short, readable label from a user id when no display name is available. */
export function shortUserLabel(userId: string): string {
  if (!userId) return "Attendee";
  // GUID-ish or long id -> show a short prefix; keep human-typed names intact.
  if (userId.length > 12) return `User ${userId.slice(0, 6)}`;
  return userId;
}

// ── Dashboard formatters (en-US) ───────────────────────────────────────────
const enShortDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});
const enMonth = new Intl.DateTimeFormat("en-US", { month: "short" });
const enLongDate = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

/** Full date, e.g. "October 14, 1988" — used for the read-only birth date. */
export function formatLongDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return enLongDate.format(d);
}

/** Short date, e.g. "Oct 24, 2021" — used for the "Created" metadata strip. */
export function formatShortDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return enShortDate.format(d);
}

/**
 * A .NET non-nullable DateTime that was never set serializes to year 0001
 * (DateTime.MinValue). Treat that — and any unparseable/empty value — as "not set",
 * which is what flips the birth-date field from read-only to editable.
 */
export function isUnsetDate(iso: string | null | undefined): boolean {
  if (!iso) return true;
  const d = new Date(iso);
  return isNaN(d.getTime()) || d.getUTCFullYear() <= 1;
}

/** ISO date -> "YYYY-MM-DD" for binding to <input type="date"> (local calendar day). */
export function toDateInputValue(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Event date range for calendar cards. Collapses same-month ranges and expands
 * cross-month/year ones; single-day events show just the date. Null-safe.
 *   single day      -> "Oct 20, 2024"
 *   same month/year -> "Oct 20 – 24, 2024"
 *   cross month     -> "Oct 20 – Nov 24, 2024"
 *   cross year      -> "Dec 20, 2024 – Jan 24, 2025"
 */
export function formatCalendarRange(
  startIso: string | null,
  endIso: string | null,
): string {
  if (!startIso) return "Date TBA";
  const start = new Date(startIso);
  if (isNaN(start.getTime())) return "Date TBA";

  const parsedEnd = endIso ? new Date(endIso) : null;
  const end = parsedEnd && !isNaN(parsedEnd.getTime()) ? parsedEnd : null;

  if (!end || start.toDateString() === end.toDateString()) {
    return enShortDate.format(start);
  }

  const sameYear = start.getFullYear() === end.getFullYear();
  const sameMonth = sameYear && start.getMonth() === end.getMonth();

  if (sameMonth) {
    return `${enMonth.format(start)} ${start.getDate()} – ${end.getDate()}, ${end.getFullYear()}`;
  }
  if (sameYear) {
    return `${enMonth.format(start)} ${start.getDate()} – ${enMonth.format(end)} ${end.getDate()}, ${end.getFullYear()}`;
  }
  return `${enShortDate.format(start)} – ${enShortDate.format(end)}`;
}

/**
 * Relative timestamp within the last 7 days ("2 hours ago", "Yesterday",
 * "3 days ago"); switches to an absolute date ("Oct 20, 2024") beyond that.
 */
export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (isNaN(then)) return "";
  const days = (Date.now() - then) / 86_400_000;
  if (days >= 7) return enShortDate.format(new Date(then));
  const rel = timeAgo(iso); // e.g. "yesterday", "2 hours ago"
  return rel.charAt(0).toUpperCase() + rel.slice(1);
}
