import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[var(--radius-card)] border border-white/[0.07] bg-surface-low p-6 sm:p-8 ${className}`}
    >
      {children}
    </section>
  );
}

export function CardHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-xl font-semibold tracking-[-0.02em] text-on-surface">
      {children}
    </h2>
  );
}

type ChipTone = "accent" | "outline";

export function Chip({
  children,
  tone = "outline",
}: {
  children: ReactNode;
  tone?: ChipTone;
}) {
  const tones: Record<ChipTone, string> = {
    accent:
      "border-indigo/40 bg-indigo/15 text-secondary",
    outline: "border-white/15 bg-white/[0.04] text-on-surface-variant",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 font-mono text-[11px] font-medium uppercase tracking-[0.05em] ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function ProgressBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
      <div
        className="h-full rounded-full bg-indigo transition-[width] duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
