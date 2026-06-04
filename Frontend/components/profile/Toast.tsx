"use client";

import { useEffect } from "react";
import { CloseIcon } from "../icons";

/**
 * Bottom-right confirmation toast. Auto-dismisses after `duration` ms and is
 * dismissible via the X. Announced to screen readers via role="status".
 */
export function Toast({
  message,
  onDismiss,
  duration = 4000,
}: {
  message: string;
  onDismiss: () => void;
  duration?: number;
}) {
  useEffect(() => {
    const id = window.setTimeout(onDismiss, duration);
    return () => window.clearTimeout(id);
  }, [onDismiss, duration]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-[60] flex items-center gap-3 rounded-md border border-white/[0.12] bg-surface-high px-4 py-3 text-sm text-on-surface"
    >
      <span>{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="text-muted transition-colors hover:text-on-surface"
      >
        <CloseIcon width={16} height={16} />
      </button>
    </div>
  );
}
