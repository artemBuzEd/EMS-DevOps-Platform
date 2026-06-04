"use client";

import { useState } from "react";
import { Card, CardHeading, ProgressBar } from "./primitives";
import { ShareIcon, SpinnerIcon } from "./icons";
import { Toast } from "./profile/Toast";
import { ApiError, registerForEvent } from "@/lib/api";
import { useAuth } from "@/lib/auth/useAuth";
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

type RegState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "done"; status: string }
  | { kind: "error" };

export function EventStatusCard({
  eventId,
  registered,
  capacity,
  endDate,
}: {
  eventId: string;
  registered: number;
  capacity: number;
  endDate: string;
}) {
  const { authenticated, login } = useAuth();
  const [registeredInternal, setRegisteredInternal] = useState<number>(registered);
  const status = deriveStatus(registeredInternal, capacity, endDate);
  const pct = capacity > 0 ? (registeredInternal / capacity) * 100 : 0;

  const [reg, setReg] = useState<RegState>({ kind: "idle" });
  const [toast, setToast] = useState<string | null>(null);

  const closed = status.label !== "OPEN"; // CLOSED or FULL → can't register

  async function onRegister() {
    if (!authenticated) {
      login({ redirectUri: window.location.href }); // bounce to sign in, come back
      return;
    }
    if (reg.kind === "loading" || reg.kind === "done") return;

    setReg({ kind: "loading" });
    try {
      const chosen = await registerForEvent(eventId);
      setReg({ kind: "done", status: chosen });
      setRegisteredInternal(prev => prev + 1)
      setToast(
        chosen === "Registered"
          ? "You're registered for this event."
          : "Registration pending — we'll confirm your spot.",
      );
    } catch (err) {
      // 401 is handled inside authedFetch (refresh/login); anything else retries.
      if (err instanceof ApiError && err.status === 401) return;
      setReg({ kind: "error" });
      setToast("Couldn't register. Try again.");
    }
  }

  const done = reg.kind === "done";

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
            {formatNumber(registeredInternal)} / {formatNumber(capacity)}
          </span>
        </div>
        <ProgressBar value={pct} />
      </div>

      <div className="mt-6 space-y-2.5">
        <button
          type="button"
          onClick={onRegister}
          disabled={closed || reg.kind === "loading" || done}
          className="inline-flex w-full items-center justify-center gap-2 rounded bg-primary py-2.5 text-sm font-medium text-on-primary transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:bg-surface-high disabled:text-muted"
        >
          {reg.kind === "loading" && (
            <SpinnerIcon className="animate-spin" width={15} height={15} />
          )}
          {done
            ? reg.status === "Registered"
              ? "Registered"
              : "Pending"
            : reg.kind === "loading"
              ? "Registering..."
              : closed
                ? "Registration closed"
                : "Register Now"}
        </button>
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded border border-white/15 py-2.5 text-sm font-medium text-on-surface transition-colors hover:border-white/30"
        >
          <ShareIcon width={15} height={15} />
          Share Event
        </button>
      </div>

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </Card>
  );
}
