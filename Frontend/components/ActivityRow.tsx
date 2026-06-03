import type { UserComment } from "@/lib/types";
import { relativeTime } from "@/lib/format";
import { StarRating } from "./StarRating";

// Level-1 surface: flat 1px border, no glow, no shadow (DESIGN.md elevation).
export function ActivityRow({ comment }: { comment: UserComment }) {
  const hasTitle = Boolean(comment.eventTitle);

  return (
    <article className="rounded-[var(--radius-card)] border border-white/[0.07] bg-surface-lowest p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3
            className={`truncate text-base font-semibold tracking-[-0.01em] ${
              hasTitle ? "text-on-surface" : "italic text-muted"
            }`}
          >
            {hasTitle ? comment.eventTitle : "Event unavailable"}
          </h3>
          <p className="mt-1 text-sm leading-[1.5] text-on-surface-variant">
            {comment.commentText}
          </p>
        </div>
        <StarRating rating={comment.rating} />
      </div>

      <div className="mt-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.05em] text-muted">
        <time dateTime={comment.createdAt}>{relativeTime(comment.createdAt)}</time>
        {comment.isChanged && (
          <>
            <span aria-hidden="true">·</span>
            <span>Edited</span>
          </>
        )}
      </div>
    </article>
  );
}
