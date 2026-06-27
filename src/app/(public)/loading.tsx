export default function Loading() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-8 p-4 md:p-8">
      <div className="shimmer h-[40vh] w-full rounded-2xl bg-[var(--color-muted)]" />
      {[0, 1, 2].map((i) => (
        <div key={i} className="space-y-3">
          <div className="shimmer h-7 w-48 rounded bg-[var(--color-muted)]" />
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 8 }).map((_, j) => (
              <div
                key={j}
                className="shimmer aspect-[2/3] w-[140px] shrink-0 rounded-lg bg-[var(--color-muted)] md:w-[180px]"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
