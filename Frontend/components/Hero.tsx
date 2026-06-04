export function Hero({
  pictureUrl,
  title,
}: {
  pictureUrl: string | null;
  title: string;
}) {
  return (
    <div className="relative h-[300px] w-full overflow-hidden bg-surface-low sm:h-[420px]">
      {pictureUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={pictureUrl}
          alt={title}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="h-full w-full bg-gradient-to-br from-surface-high via-surface-low to-black" />
      )}

      {/* darken top (under navbar) and bottom (under controls) */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />

      {/* carousel dots (decorative) */}
      <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-1.5">
        {Array.from({ length: 9 }).map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all ${
              i === 0 ? "w-5 bg-white" : "w-1.5 bg-white/40"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
