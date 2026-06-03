import { StarIcon } from "./icons";

// White stars — the rating is informational, not a status indicator, so it must
// not borrow the lime/indigo accent colors. Renders nothing when rating is null
// (no empty placeholder or zero-star row).
export function StarRating({
  rating,
  max = 5,
}: {
  rating: number | null;
  max?: number;
}) {
  if (rating == null) return null;
  const filled = Math.max(0, Math.min(max, Math.round(rating)));

  return (
    <span
      className="inline-flex shrink-0 items-center gap-0.5"
      aria-label={`Rated ${filled} out of ${max}`}
    >
      {Array.from({ length: max }, (_, i) => (
        <StarIcon
          key={i}
          aria-hidden="true"
          width={14}
          height={14}
          className={i < filled ? "text-on-surface" : "text-white/15"}
        />
      ))}
    </span>
  );
}
