// Shared form styling for the Create Event sections, mirroring the Edit Profile
// form (components/profile/ProfileForm.tsx) so inputs/labels look identical across
// the app and stay faithful to DESIGN.md (dark #121214 fields, indigo focus ring,
// Geist uppercase labels).

export const labelClass =
  "mb-2 block font-mono text-[12px] font-medium uppercase tracking-[0.05em] text-white/60";

export function inputClass(invalid: boolean): string {
  return [
    "w-full rounded border bg-[#121214] px-3 py-2.5 text-sm text-on-surface",
    "placeholder:text-muted focus:outline-none focus:ring-2 disabled:opacity-50",
    invalid
      ? "border-error focus:border-error focus:ring-error/10"
      : "border-white/10 focus:border-secondary-container focus:ring-secondary-container/10",
  ].join(" ");
}

// Helper/hint text under an input (the inline validation constraints).
export const helpClass = "mt-1.5 text-xs text-muted";
export const errorTextClass = "mt-1.5 text-xs text-error";

// Section card wrapper: Level-2 surface with the gradient glow border (no shadow).
export const sectionCardClass =
  "card-glow rounded-[var(--radius-card)] p-6 sm:p-8";

export const sectionHeadingClass =
  "text-[22px] font-semibold tracking-[-0.02em] text-on-surface sm:text-2xl";
export const sectionSubtitleClass = "mt-1 text-sm text-white/60";
