"use client";

import { useState } from "react";
import { Card } from "./primitives";
import { StarIcon, SpinnerIcon } from "./icons";
import { Toast } from "./profile/Toast";
import { initial, shortUserLabel, timeAgo } from "@/lib/format";
import { ApiError, createComment } from "@/lib/api";
import { useAuth } from "@/lib/auth/useAuth";
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

// Interactive 1–5 star selector: click to set, hover/focus to preview.
function RatingPicker({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div
      role="radiogroup"
      aria-label="Your rating"
      className="inline-flex items-center gap-1"
      onMouseLeave={() => setHover(0)}
    >
      {Array.from({ length: 5 }).map((_, i) => {
        const star = i + 1;
        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`${star} star${star > 1 ? "s" : ""}`}
            disabled={disabled}
            onMouseEnter={() => setHover(star)}
            onFocus={() => setHover(star)}
            onClick={() => onChange(star)}
            className="rounded p-0.5 transition-transform hover:scale-110 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <StarIcon
              width={18}
              height={18}
              className={star <= shown ? "text-lime" : "text-white/20"}
            />
          </button>
        );
      })}
    </div>
  );
}

type SubmitState = { kind: "idle" } | { kind: "submitting" } | { kind: "error" };

// The composer. Hidden behind sign-in: anonymous visitors get a prompt that
// bounces to Keycloak and returns (same pattern as EventStatusCard's register).
function Composer({
  eventId,
  onPosted,
}: {
  eventId: string;
  onPosted: (c: Comment) => void;
}) {
  const { authenticated, login, user } = useAuth();
  const [text, setText] = useState("");
  const [rating, setRating] = useState(0);
  const [state, setState] = useState<SubmitState>({ kind: "idle" });
  const [toast, setToast] = useState<string | null>(null);

  if (!authenticated) {
    return (
      <button
        type="button"
        onClick={() => login({ redirectUri: window.location.href })}
        className="flex w-full items-center justify-center rounded border border-white/15 py-2.5 text-sm font-medium text-on-surface transition-colors hover:border-white/30"
      >
        Sign in to comment
      </button>
    );
  }

  const submitting = state.kind === "submitting";
  const canSubmit = text.trim().length > 0 && rating >= 1 && !submitting;

  async function onSubmit() {
    if (!canSubmit) return;
    setState({ kind: "submitting" });
    try {
      const created = await createComment({
        event_id: eventId,
        comment: text.trim(),
        rating,
      });
      // The POST response carries no profile; fill the author from the signed-in
      // user so the optimistic comment shows your name (no extra request).
      onPosted({
        ...created,
        user: user
          ? {
              user_id: user.sub,
              first_name: user.firstName,
              last_name: user.lastName,
            }
          : null,
      });
      setText("");
      setRating(0);
      setState({ kind: "idle" });
      setToast("Comment posted.");
    } catch (err) {
      // 401 is handled inside authedFetch (refresh/re-login); nothing to show.
      if (err instanceof ApiError && err.status === 401) {
        setState({ kind: "idle" });
        return;
      }
      setState({ kind: "error" });
      setToast("Couldn't post your comment. Try again.");
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-sm text-on-surface-variant">Your rating</span>
        <RatingPicker value={rating} onChange={setRating} disabled={submitting} />
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Share your thoughts about this event…"
        rows={3}
        disabled={submitting}
        className="w-full resize-none rounded-md border border-white/15 bg-surface-container px-3 py-2 text-sm leading-relaxed text-on-surface outline-none transition-colors placeholder:text-muted focus:border-white/30 disabled:opacity-60"
      />
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit}
          className="inline-flex items-center justify-center gap-2 rounded bg-primary px-4 py-2 text-sm font-medium text-on-primary transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:bg-surface-high disabled:text-muted"
        >
          {submitting && (
            <SpinnerIcon className="animate-spin" width={15} height={15} />
          )}
          {submitting ? "Posting…" : "Add comment"}
        </button>
      </div>

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}

export function DiscussionCard({
  comments,
  eventId,
}: {
  comments: Comment[];
  eventId: string;
}) {
  // Seed once from the prop; new comments are prepended so they show instantly.
  const [items, setItems] = useState<Comment[]>(comments);
  console.log('items',items)
  return (
    <Card>
      <h2 className="text-xl font-semibold tracking-[-0.02em]">
        Attendee Discussion
      </h2>

      <div className="mt-5">
        <Composer
          eventId={eventId}
          onPosted={(c) => setItems((prev) => [c, ...prev])}
        />
      </div>

      <div className="mt-6 space-y-5">
        {items.length === 0 && (
          <p className="text-sm text-muted">No comments yet. Be the first.</p>
        )}
        {items.map((c) => {
          const name = c.user
            ? [c.user.first_name, c.user.last_name].filter(Boolean).join(" ")
            : "";
          const display = name || shortUserLabel(c.user_id);
          return (
            <div key={c.id} className="flex gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-surface-high to-surface-container text-sm font-medium text-on-surface-variant">
                {initial(display)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-on-surface">{display}</span>
                  <span className="text-xs text-muted">{timeAgo(c.added_at)}</span>
                  <Stars rating={c.rating} />
                </div>
                <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">
                  {c.comment}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
