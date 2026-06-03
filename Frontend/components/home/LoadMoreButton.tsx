"use client";

import { SpinnerIcon } from "@/components/icons";

// Stays in the DOM while loading (prevents layout shift); shows a spinner and a
// "Loading…" label, and is disabled-but-present rather than removed.
export function LoadMoreButton({
  loading,
  onClick,
}: {
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <div className="mt-10 flex justify-center">
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        aria-busy={loading}
        className="inline-flex items-center gap-2 rounded-md border border-white/[0.12] bg-surface-low px-6 py-2.5 text-sm font-medium text-on-surface transition-colors hover:border-white/[0.22] disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo"
      >
        {loading ? (
          <>
            <SpinnerIcon width={16} height={16} className="animate-spin" />
            Loading…
          </>
        ) : (
          "Load more"
        )}
      </button>
    </div>
  );
}
