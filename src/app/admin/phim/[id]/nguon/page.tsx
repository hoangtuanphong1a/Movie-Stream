import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getMovieForEdit } from "@/lib/admin-queries";
import { AddSourceForm, SourceActions } from "@/components/admin/source-manager";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

function SourceList({
  sources,
  pageMovieId,
}: {
  sources: {
    id: string;
    label: string | null;
    url: string;
    type: string;
    isDefault: boolean;
  }[];
  pageMovieId: string;
}) {
  if (sources.length === 0) {
    return (
      <p className="text-sm text-[var(--color-muted-foreground)]">
        Chưa có nguồn phát.
      </p>
    );
  }
  return (
    <ul className="space-y-2">
      {sources.map((s) => (
        <li
          key={s.id}
          className="flex flex-wrap items-center gap-3 rounded-md border border-[var(--color-border)] bg-[var(--color-card)] p-2 text-sm"
        >
          <Badge>{s.type}</Badge>
          <span className="font-medium">{s.label || "—"}</span>
          {s.isDefault && (
            <span className="text-xs text-[var(--color-primary)]">
              ★ Mặc định
            </span>
          )}
          <span className="max-w-md flex-1 truncate text-xs text-[var(--color-muted-foreground)]">
            {s.url}
          </span>
          <SourceActions
            id={s.id}
            pageMovieId={pageMovieId}
            isDefault={s.isDefault}
          />
        </li>
      ))}
    </ul>
  );
}

export default async function MovieSourcesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const movie = await getMovieForEdit(id);
  if (!movie) notFound();

  return (
    <div className="max-w-3xl">
      <Link
        href={`/admin/phim/${movie.id}`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-[var(--color-muted-foreground)] hover:text-white"
      >
        <ChevronLeft className="size-4" /> Sửa phim
      </Link>
      <h1 className="mb-6 text-2xl font-bold">Nguồn phát: {movie.title}</h1>

      {movie.type === "MOVIE" ? (
        <section className="space-y-3">
          <SourceList sources={movie.videoSources} pageMovieId={movie.id} />
          <AddSourceForm pageMovieId={movie.id} movieId={movie.id} />
        </section>
      ) : movie.seasons.length === 0 ||
        movie.seasons.every((s) => s.episodes.length === 0) ? (
        <p className="rounded-md bg-[var(--color-muted)] p-4 text-sm text-[var(--color-muted-foreground)]">
          Phim bộ này chưa có tập. (Quản lý tập hiện được tạo qua dữ liệu seed /
          import — có thể mở rộng thêm CRUD tập.)
        </p>
      ) : (
        <div className="space-y-6">
          {movie.seasons.map((season) =>
            season.episodes.map((ep) => (
              <section key={ep.id} className="space-y-3">
                <h2 className="font-semibold">
                  Phần {season.number} · Tập {ep.number}
                  {ep.title ? ` — ${ep.title}` : ""}
                </h2>
                <SourceList
                  sources={ep.videoSources}
                  pageMovieId={movie.id}
                />
                <AddSourceForm pageMovieId={movie.id} episodeId={ep.id} />
              </section>
            )),
          )}
        </div>
      )}
    </div>
  );
}
