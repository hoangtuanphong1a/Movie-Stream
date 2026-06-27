import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Star, Play, Calendar, Clock } from "lucide-react";
import {
  getMovieBySlug,
  getRelatedMovies,
  getUserMovieFlags,
} from "@/lib/queries";
import { getCurrentUser } from "@/lib/session";
import { posterUrl, backdropUrl, profileUrl } from "@/lib/images";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MovieRow } from "@/components/movie-row";
import { MovieActions } from "@/components/movie-actions";
import { ReviewForm } from "@/components/review-form";
import { formatRuntime, getYear } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const movie = await getMovieBySlug(slug);
  if (!movie) return { title: "Không tìm thấy phim" };
  return {
    title: movie.title,
    description: movie.overview ?? undefined,
    openGraph: {
      title: movie.title,
      description: movie.overview ?? undefined,
      images: [backdropUrl(movie.backdropPath)],
    },
  };
}

export default async function MovieDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const movie = await getMovieBySlug(slug);
  if (!movie) notFound();

  const genreIds = movie.genres.map((g) => g.genre.id);
  const related = await getRelatedMovies(movie.id, genreIds);

  const user = await getCurrentUser();
  const flags = user
    ? await getUserMovieFlags(user.id, movie.id)
    : { isFavorite: false, isWatchlist: false };
  const myReview = user
    ? movie.reviews.find((r) => r.user.id === user.id)
    : undefined;

  const avgRating =
    movie.reviews.length > 0
      ? movie.reviews.reduce((s, r) => s + r.rating, 0) / movie.reviews.length
      : null;

  return (
    <div className="pb-10">
      {/* Backdrop header */}
      <div className="relative">
        <div className="relative h-[50vh] min-h-[340px] w-full">
          <Image
            src={backdropUrl(movie.backdropPath)}
            alt={movie.title}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-background)] via-[var(--color-background)]/60 to-transparent" />
        </div>

        <div className="mx-auto -mt-40 max-w-[1400px] px-4 md:px-8">
          <div className="flex flex-col gap-6 md:flex-row">
            <div className="relative mx-auto aspect-[2/3] w-40 shrink-0 overflow-hidden rounded-lg ring-1 ring-white/10 md:mx-0 md:w-56">
              <Image
                src={posterUrl(movie.posterPath)}
                alt={movie.title}
                fill
                sizes="224px"
                className="object-cover"
              />
            </div>

            <div className="relative flex-1">
              <h1 className="text-3xl font-bold md:text-4xl">{movie.title}</h1>
              {movie.originalTitle && movie.originalTitle !== movie.title && (
                <p className="mt-1 text-[var(--color-muted-foreground)]">
                  {movie.originalTitle}
                </p>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-[var(--color-muted-foreground)]">
                <span className="flex items-center gap-1 text-yellow-400">
                  <Star className="size-4 fill-yellow-400" />
                  {movie.voteAverage.toFixed(1)}
                  {avgRating !== null && (
                    <span className="ml-1 text-[var(--color-muted-foreground)]">
                      (Người dùng: {avgRating.toFixed(1)})
                    </span>
                  )}
                </span>
                {movie.releaseDate && (
                  <span className="flex items-center gap-1">
                    <Calendar className="size-4" /> {getYear(movie.releaseDate)}
                  </span>
                )}
                {movie.runtime && (
                  <span className="flex items-center gap-1">
                    <Clock className="size-4" /> {formatRuntime(movie.runtime)}
                  </span>
                )}
                <Badge>{movie.type === "TV" ? "Phim bộ" : "Phim lẻ"}</Badge>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {movie.genres.map((g) => (
                  <Link key={g.genre.id} href={`/duyet?the-loai=${g.genre.slug}`}>
                    <Badge className="hover:border-[var(--color-primary)]">
                      {g.genre.name}
                    </Badge>
                  </Link>
                ))}
              </div>

              <p className="mt-4 max-w-3xl text-sm leading-relaxed text-gray-200 md:text-base">
                {movie.overview ?? "Chưa có mô tả."}
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href={`/xem/${movie.slug}`}
                  className={buttonVariants({ variant: "default", size: "lg" })}
                >
                  <Play className="fill-white" /> Xem ngay
                </Link>
                <MovieActions
                  movieId={movie.id}
                  slug={movie.slug}
                  isLoggedIn={Boolean(user)}
                  initialFavorite={flags.isFavorite}
                  initialWatchlist={flags.isWatchlist}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-[1400px] space-y-10 px-4 md:px-8">
        {/* Trailer */}
        {movie.trailerKey && (
          <section>
            <h2 className="mb-3 text-xl font-semibold">Trailer</h2>
            <div className="aspect-video w-full max-w-3xl overflow-hidden rounded-lg">
              <iframe
                className="h-full w-full"
                src={`https://www.youtube.com/embed/${movie.trailerKey}`}
                title="Trailer"
                allowFullScreen
              />
            </div>
          </section>
        )}

        {/* Danh sách tập (phim bộ) */}
        {movie.type === "TV" && movie.seasons.length > 0 && (
          <section>
            <h2 className="mb-3 text-xl font-semibold">Danh sách tập</h2>
            {movie.seasons.map((season) => (
              <div key={season.id} className="mb-4">
                <h3 className="mb-2 text-sm font-medium text-[var(--color-muted-foreground)]">
                  {season.name ?? `Phần ${season.number}`}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {season.episodes.map((ep) => (
                    <Link
                      key={ep.id}
                      href={`/xem/${movie.slug}?tap=${ep.id}`}
                      className="rounded-md border border-[var(--color-border)] bg-[var(--color-muted)] px-3 py-2 text-sm hover:border-[var(--color-primary)]"
                    >
                      Tập {ep.number}
                      {ep.title ? ` · ${ep.title}` : ""}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Diễn viên */}
        {movie.cast.length > 0 && (
          <section>
            <h2 className="mb-3 text-xl font-semibold">Diễn viên</h2>
            <div className="no-scrollbar flex gap-4 overflow-x-auto">
              {movie.cast.map((c) => (
                <div key={c.id} className="w-24 shrink-0 text-center">
                  <div className="relative mx-auto aspect-[2/3] w-24 overflow-hidden rounded-md">
                    <Image
                      src={profileUrl(c.person.profilePath)}
                      alt={c.person.name}
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs font-medium">
                    {c.person.name}
                  </p>
                  {c.character && (
                    <p className="line-clamp-1 text-[11px] text-[var(--color-muted-foreground)]">
                      {c.character}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Đánh giá */}
        <section id="danh-gia">
          <h2 className="mb-3 text-xl font-semibold">
            Đánh giá & bình luận ({movie.reviews.length})
          </h2>

          {user ? (
            <div className="mb-6">
              <ReviewForm
                movieId={movie.id}
                slug={movie.slug}
                initialRating={myReview?.rating}
                initialComment={myReview?.comment ?? undefined}
              />
            </div>
          ) : (
            <p className="mb-6 text-sm text-[var(--color-muted-foreground)]">
              <Link
                href={`/dang-nhap?callbackUrl=/phim/${movie.slug}`}
                className="text-[var(--color-primary)] hover:underline"
              >
                Đăng nhập
              </Link>{" "}
              để viết đánh giá.
            </p>
          )}

          {movie.reviews.length === 0 ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Chưa có đánh giá nào. Hãy là người đầu tiên!
            </p>
          ) : (
            <ul className="space-y-4">
              {movie.reviews.map((r) => (
                <li
                  key={r.id}
                  className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      {r.user.name ?? "Người dùng"}
                    </span>
                    <span className="flex items-center gap-1 text-sm text-yellow-400">
                      <Star className="size-3.5 fill-yellow-400" /> {r.rating}/10
                    </span>
                  </div>
                  {r.comment && (
                    <p className="mt-2 text-sm text-gray-200">{r.comment}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Phim liên quan */}
      {related.length > 0 && (
        <div className="mt-10">
          <MovieRow title="Phim liên quan" movies={related} />
        </div>
      )}
    </div>
  );
}
