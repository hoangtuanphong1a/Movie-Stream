import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getMovieBySlug } from "@/lib/queries";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { VideoPlayer } from "@/components/video-player";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const movie = await getMovieBySlug(slug);
  return { title: movie ? `Xem: ${movie.title}` : "Xem phim" };
}

export default async function WatchPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;

  // Khách (chưa đăng nhập) vẫn xem được phim; chỉ tính năng lưu tiến độ cần đăng nhập.
  const user = await getCurrentUser();

  const movie = await getMovieBySlug(slug);
  if (!movie) notFound();

  const episodes = movie.seasons.flatMap((s) =>
    s.episodes.map((e) => ({ ...e, seasonNumber: s.number })),
  );
  const tap = typeof sp.tap === "string" ? sp.tap : undefined;
  const currentEpisode =
    movie.type === "TV"
      ? episodes.find((e) => e.id === tap) ?? episodes[0] ?? null
      : null;

  const sources = (
    currentEpisode ? currentEpisode.videoSources : movie.videoSources
  )
    .slice()
    .sort((a, b) => Number(b.isDefault) - Number(a.isDefault));

  const history = user
    ? await prisma.watchHistory.findFirst({
        where: {
          userId: user.id,
          movieId: movie.id,
          episodeId: currentEpisode?.id ?? null,
        },
      })
    : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <Link
        href={`/phim/${movie.slug}`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-foreground)]"
      >
        <ChevronLeft className="size-4" /> Quay lại chi tiết
      </Link>

      <h1 className="mb-1 font-serif text-2xl font-bold tracking-tight md:text-3xl">
        {movie.title}
      </h1>
      {currentEpisode && (
        <p className="mb-4 text-sm text-[var(--color-muted-foreground)]">
          Tập {currentEpisode.number}
          {currentEpisode.title ? ` · ${currentEpisode.title}` : ""}
        </p>
      )}

      {!user && (
        <p className="mb-4 rounded-md border border-[var(--color-border)] bg-[var(--color-muted)] px-3 py-2 text-sm text-[var(--color-muted-foreground)]">
          Bạn đang xem với tư cách khách.{" "}
          <Link
            href={`/dang-nhap?callbackUrl=${encodeURIComponent(`/xem/${movie.slug}`)}`}
            className="text-[var(--color-primary)] hover:underline"
          >
            Đăng nhập
          </Link>{" "}
          để lưu tiến độ xem và thêm vào yêu thích.
        </p>
      )}

      <VideoPlayer
        sources={sources}
        movieId={movie.id}
        episodeId={currentEpisode?.id ?? null}
        initialTime={history?.progressSeconds ?? 0}
        trackProgress={Boolean(user)}
      />

      {/* Danh sách tập (phim bộ) */}
      {movie.type === "TV" && episodes.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-3 font-serif text-xl font-bold tracking-tight">
            Danh sách tập
          </h2>
          <div className="flex flex-wrap gap-2">
            {episodes.map((ep) => (
              <Link
                key={ep.id}
                href={`/xem/${movie.slug}?tap=${ep.id}`}
                className={cn(
                  "rounded-md border px-3 py-2 text-sm",
                  ep.id === currentEpisode?.id
                    ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
                    : "border-[var(--color-border)] bg-[var(--color-muted)] hover:border-[var(--color-primary)]",
                )}
              >
                Tập {ep.number}
              </Link>
            ))}
          </div>
        </div>
      )}

      {movie.overview && (
        <p className="mt-6 max-w-3xl text-sm leading-relaxed text-[var(--color-muted-foreground)]">
          {movie.overview}
        </p>
      )}
    </div>
  );
}
