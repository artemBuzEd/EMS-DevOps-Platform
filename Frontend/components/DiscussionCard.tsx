import { Card } from "./primitives";
import { StarIcon } from "./icons";
import { initial, shortUserLabel, timeAgo } from "@/lib/format";
import type { Comment } from "@/lib/types";

function Stars({ rating }: { rating: number }) {
  if (!rating) return null;
  return (
    <span className="ml-2 inline-flex items-center gap-0.5 align-middle">
      {Array.from({ length: 5 }).map((_, i) => (
        <StarIcon
          key={i}
          width={11}
          height={11}
          className={i < rating ? "text-lime" : "text-white/15"}
        />
      ))}
    </span>
  );
}

export function DiscussionCard({ comments }: { comments: Comment[] }) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-[-0.02em]">
          Attendee Discussion
        </h2>
        <span className="cursor-pointer font-mono text-xs font-medium uppercase tracking-[0.05em] text-secondary hover:text-on-surface">
          Join Chat
        </span>
      </div>

      <div className="mt-5 space-y-5">
        {comments.length === 0 && (
          <p className="text-sm text-muted">No comments yet. Be the first.</p>
        )}
        {comments.map((c) => (
          <div key={c.id} className="flex gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-surface-high to-surface-container text-sm font-medium text-on-surface-variant">
              {initial(c.user_id)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium text-on-surface">
                  {shortUserLabel(c.user_id)}
                </span>
                <span className="text-xs text-muted">{timeAgo(c.added_at)}</span>
                <Stars rating={c.rating} />
              </div>
              <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">
                {c.comment}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
