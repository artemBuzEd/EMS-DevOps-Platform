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
