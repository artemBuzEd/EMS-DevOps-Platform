"use client";

import { formatDuration } from "@/lib/format";
import {
  errorTextClass,
  inputClass,
  labelClass,
  sectionCardClass,
  sectionHeadingClass,
  sectionSubtitleClass,
} from "./formStyles";

// `datetime-local` values are "YYYY-MM-DDTHH:mm" (no zone). We treat them as local
// time and let the orchestrator convert to ISO for the POST body.
export function SchedulingSection({
  start,
  end,
  endError,
  startInPast,
  endAutoCleared,
  disabled,
  onStartChange,
  onEndChange,
}: {
  start: string;
  end: string;
  endError: string | null;
  startInPast: boolean;
  endAutoCleared: boolean;
  disabled: boolean;
  onStartChange: (v: string) => void;
  onEndChange: (v: string) => void;
}) {
  const duration = formatDuration(start, end);

  return (
    <section className={sectionCardClass} aria-labelledby="scheduling-heading">
      <h2 id="scheduling-heading" className={sectionHeadingClass}>
        Scheduling
      </h2>
      <p className={sectionSubtitleClass}>
        When does it start and end? End must be after start.
      </p>

      <div className="mt-6 grid grid-cols-1 items-start gap-x-6 gap-y-5 sm:grid-cols-[1fr_auto_1fr]">
        {/* Start */}
        <div>
          <label htmlFor="event-start" className={labelClass}>
            Start Date &amp; Time
          </label>
          <input
            id="event-start"
            type="datetime-local"
            value={start}
            disabled={disabled}
            onChange={(e) => onStartChange(e.target.value)}
            aria-describedby={startInPast ? "event-start-warn" : undefined}
            className={`${inputClass(false)} [color-scheme:dark]`}
          />
          {startInPast && (
            <p id="event-start-warn" className="mt-1.5 text-xs text-[#f5b54a]">
              This start date is in the past — is that intentional?
            </p>
          )}
        </div>

        {/* Live duration between the two pickers */}
        <div className="flex flex-col sm:items-center sm:pt-7">
          <span className="font-mono text-[11px] uppercase tracking-[0.05em] text-white/40">
            Duration
          </span>
          <span className="mt-1 text-sm text-on-surface-variant" aria-live="polite">
            {duration || "—"}
          </span>
        </div>

        {/* End */}
        <div>
          <label htmlFor="event-end" className={labelClass}>
            End Date &amp; Time
          </label>
          <input
            id="event-end"
            type="datetime-local"
            value={end}
            min={start || undefined}
            disabled={disabled || !start}
            onChange={(e) => onEndChange(e.target.value)}
            aria-invalid={endError ? true : undefined}
            aria-describedby={
              endError
                ? "event-end-error"
                : endAutoCleared
                  ? "event-end-note"
                  : undefined
            }
            className={`${inputClass(!!endError)} [color-scheme:dark] disabled:cursor-not-allowed`}
          />
          {endError ? (
            <p id="event-end-error" className={errorTextClass} role="alert">
              {endError}
            </p>
          ) : endAutoCleared ? (
            <p id="event-end-note" className="mt-1.5 text-xs text-muted">
              End was cleared because it fell before the new start time.
            </p>
          ) : !start ? (
            <p className="mt-1.5 text-xs text-muted">Pick a start time first.</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
