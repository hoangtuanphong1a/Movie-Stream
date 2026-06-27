export default function Loading() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-8 p-4 md:p-8">
      <div className="h-[40vh] w-full animate-pulse rounded-xl bg-[var(--color-muted)]" />
      {[0, 1, 2].map((i) => (
        <div key={i} className="space-y-3">
          <div className="h-6 w-40 animate-pulse rounded bg-[var(--color-muted)]" />
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 8 }).map((_, j) => (
              <div
                key={j}
                className="aspect-[2/3] w-[140px] shrink-0 animate-pulse rounded-md bg-[var(--color-muted)] md:w-[180px]"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
