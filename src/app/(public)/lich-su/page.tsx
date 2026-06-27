import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { requireUser } from "@/lib/session";
import { getWatchHistory } from "@/lib/queries";
import { posterUrl } from "@/lib/images";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Lịch sử xem" };

export default async function HistoryPage() {
  const user = await requireUser();
  const history = await getWatchHistory(user.id);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="mb-6 font-serif text-3xl font-bold tracking-tight">Lịch sử xem</h1>

      {history.length === 0 ? (
        <p className="text-[var(--color-muted-foreground)]">
          Bạn chưa xem phim nào.
        </p>
      ) : (
        <ul className="space-y-3">
          {history.map((h) => {
            const pct =
              h.durationSeconds > 0
                ? Math.min(
                    100,
                    Math.round((h.progressSeconds / h.durationSeconds) * 100),
                  )
                : 0;
            const watchHref = `/xem/${h.movie.slug}${
              h.episodeId ? `?tap=${h.episodeId}` : ""
            }`;
            return (
              <li
                key={h.id}
                className="flex gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-3"
              >
                <Link
                  href={`/phim/${h.movie.slug}`}
                  className="relative aspect-[2/3] w-16 shrink-0 overflow-hidden rounded"
                >
                  <Image
                    src={posterUrl(h.movie.posterPath)}
                    alt={h.movie.title}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </Link>
                <div className="flex-1">
                  <Link
                    href={`/phim/${h.movie.slug}`}
                    className="font-medium hover:text-[var(--color-primary)]"
                  >
                    {h.movie.title}
                  </Link>
                  {h.episode && (
                    <p className="text-xs text-[var(--color-muted-foreground)]">
                      Tập {h.episode.number}
                      {h.episode.title ? ` · ${h.episode.title}` : ""}
                    </p>
                  )}
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded bg-[var(--color-muted)]">
                    <div
                      className="h-full rounded bg-[var(--color-primary)]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
                    Đã xem {pct}% ·{" "}
                    {new Date(h.updatedAt).toLocaleDateString("vi-VN")}
                  </p>
                </div>
                <Link
                  href={watchHref}
                  className={buttonVariants({ size: "sm" })}
                >
                  Xem tiếp
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
