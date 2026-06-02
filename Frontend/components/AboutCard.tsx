import { Card, CardHeading } from "./primitives";

export function AboutCard({ description }: { description: string }) {
  const paragraphs = description
    .split(/\n{2,}|\r\n\r\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <Card>
      <CardHeading>About the Event</CardHeading>
      <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-on-surface-variant">
        {paragraphs.length > 0 ? (
          paragraphs.map((p, i) => <p key={i}>{p}</p>)
        ) : (
          <p className="text-muted">No description provided.</p>
        )}
      </div>
    </Card>
  );
}
