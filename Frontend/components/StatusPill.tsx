type Tone = {
  className: string;
};

// Status drives the color. Lime is reserved for the "live/success" Registered
// state (DESIGN.md), indigo for Pending, neutral gray for Completed. Matching is
// case-insensitive on the raw status string.
const TONES: Record<string, Tone> = {
  registered: { className: "border-lime/40 bg-lime/15 text-lime" },
  pending: { className: "border-indigo/40 bg-indigo/15 text-secondary" },
  completed: {
    className: "border-white/15 bg-white/[0.04] text-on-surface-variant",
  },
};

const FALLBACK: Tone = {
  className: "border-white/15 bg-white/[0.04] text-on-surface-variant",
};

function titleCase(status: string): string {
  if (!status) return "Unknown";
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

export function StatusPill({
  status,
  eventTitle,
}: {
  status: string;
  eventTitle: string | null;
}) {
  const key = (status ?? "").trim().toLowerCase();
  const tone = TONES[key] ?? FALLBACK;
  const label = titleCase((status ?? "").trim());

  return (
    <span
      // Color alone conveys meaning, so spell it out for assistive tech and
      // include which event it belongs to.
      aria-label={`${eventTitle ?? "Event"}, ${label}`}
      className={`inline-flex shrink-0 items-center rounded-full border px-3 py-1 font-mono text-[11px] font-medium uppercase tracking-[0.05em] ${tone.className}`}
    >
      {label}
    </span>
  );
}
