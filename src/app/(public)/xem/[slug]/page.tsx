import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
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

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/dang-nhap?callbackUrl=${encodeURIComponent(`/xem/${slug}`)}`);
  }

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

  const history = await prisma.watchHistory.findFirst({
    where: {
      userId: user.id,
      movieId: movie.id,
      episodeId: currentEpisode?.id ?? null,
    },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <Link
        href={`/phim/${movie.slug}`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-[var(--color-muted-foreground)] hover:text-white"
      >
        <ChevronLeft className="size-4" /> Quay lại chi tiết
      </Link>

      <h1 className="mb-1 text-xl font-bold md:text-2xl">{movie.title}</h1>
      {currentEpisode && (
        <p className="mb-4 text-sm text-[var(--color-muted-foreground)]">
          Tập {currentEpisode.number}
          {currentEpisode.title ? ` · ${currentEpisode.title}` : ""}
        </p>
      )}

      <VideoPlayer
        sources={sources}
        movieId={movie.id}
        episodeId={currentEpisode?.id ?? null}
        initialTime={history?.progressSeconds ?? 0}
      />

      {/* Danh sách tập (phim bộ) */}
      {movie.type === "TV" && episodes.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-3 text-lg font-semibold">Danh sách tập</h2>
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
        <p className="mt-6 max-w-3xl text-sm leading-relaxed text-gray-300">
          {movie.overview}
        </p>
      )}
    </div>
  );
}
