import { Card, CardHeading, ProgressBar } from "./primitives";
import { ShareIcon } from "./icons";
import { formatNumber } from "@/lib/format";

type Status = { label: string; className: string };

function deriveStatus(
  registered: number,
  capacity: number,
  endDate: string,
): Status {
  const ended = !isNaN(Date.parse(endDate)) && new Date(endDate) < new Date();
  if (ended)
    return { label: "CLOSED", className: "border-white/15 text-on-surface-variant" };
  if (capacity > 0 && registered >= capacity)
    return { label: "FULL", className: "border-error/40 text-error" };
  return { label: "OPEN", className: "border-lime/40 text-lime" };
}

export function EventStatusCard({
  registered,
  capacity,
  endDate,
}: {
  registered: number;
  capacity: number;
  endDate: string;
}) {
  const status = deriveStatus(registered, capacity, endDate);
  const pct = capacity > 0 ? (registered / capacity) * 100 : 0;

  return (
    <Card>
      <CardHeading>Event Status</CardHeading>

      <div className="mt-5 flex items-center justify-between">
        <span className="text-sm text-on-surface-variant">Registration</span>
        <span
          className={`rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-medium uppercase tracking-[0.05em] ${status.className}`}
        >
          {status.label}
        </span>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-on-surface-variant">Capacity</span>
          <span className="text-on-surface">
            {formatNumber(registered)} / {formatNumber(capacity)}
          </span>
        </div>
        <ProgressBar value={pct} />
      </div>

      <div className="mt-6 space-y-2.5">
        <button className="w-full rounded bg-primary py-2.5 text-sm font-medium text-on-primary transition-opacity hover:opacity-90">
          Register Now
        </button>
        <button className="flex w-full items-center justify-center gap-2 rounded border border-white/15 py-2.5 text-sm font-medium text-on-surface transition-colors hover:border-white/30">
          <ShareIcon width={15} height={15} />
          Share Event
        </button>
      </div>
    </Card>
  );
}
