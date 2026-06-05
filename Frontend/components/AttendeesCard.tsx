import { Card, CardHeading } from "./primitives";
import { UserIcon } from "./icons";
import { mediaUrl } from "@/lib/api";
import { initial } from "@/lib/format";
import type { EventAttendee } from "@/lib/types";

// Read-only roster of registered users. Registration owns no real backend, so a
// user_id can repeat across rows — show each person once.
export function AttendeesCard({ attendees }: { attendees: EventAttendee[] }) {
  const unique = Array.from(
    new Map(attendees.map((a) => [a.user_id, a])).values(),
  );

  return (
    <Card>
      <CardHeading>Attendees ({unique.length})</CardHeading>

      {unique.length === 0 ? (
        <p className="mt-5 text-sm text-muted">No attendees yet.</p>
      ) : (
        <ul className="mt-5 space-y-3">
          {unique.map((a) => {
            const fullName = [a.profile?.first_name, a.profile?.last_name]
              .filter(Boolean)
              .join(" ");
            // No resolvable profile → a neutral "Guest" with a person glyph,
            // rather than a faked initial or a raw user-id fragment.
            const hasName = fullName.length > 0;
            const name = hasName ? fullName : "Guest";
            const avatar = mediaUrl(a.profile?.avatar_url);
            return (
              <li key={a.user_id} className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-surface-high to-surface-container text-sm font-medium text-on-surface-variant">
                  {avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatar} alt="" className="h-full w-full object-cover" />
                  ) : hasName ? (
                    initial(name)
                  ) : (
                    <UserIcon width={18} height={18} />
                  )}
                </span>
                <span
                  className={`min-w-0 truncate text-sm font-medium ${
                    hasName ? "text-on-surface" : "text-on-surface-variant"
                  }`}
                >
                  {name}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
