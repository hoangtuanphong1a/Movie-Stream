import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Star, Play, Calendar, Clock } from "lucide-react";
import {
  getMovieBySlug,
  getRelatedMovies,
  getUserMovieFlags,
  getComments,
} from "@/lib/queries";
import { getCurrentUser } from "@/lib/session";
import { posterUrl, backdropUrl, profileUrl } from "@/lib/images";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MovieRow } from "@/components/movie-row";
import { MovieActions } from "@/components/movie-actions";
import { ReviewForm } from "@/components/review-form";
import { CommentSection } from "@/components/comment-section";
import { Reveal } from "@/components/motion/reveal";
import { formatRuntime, getYear, cn } from "@/lib/utils";

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

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-4 flex items-center gap-3 font-serif text-2xl font-bold tracking-tight md:text-3xl">
      <span className="h-7 w-1 rounded-full bg-[var(--color-primary)]" />
      {children}
    </h2>
  );
}

/** Hàng 5 sao thể hiện điểm 0–10. */
function StarRow({ value, className }: { value: number; className?: string }) {
  const full = Math.round(value / 2);
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn(
            "size-3.5",
            i < full ? "fill-amber-500 text-amber-500" : "text-[var(--color-border)]",
          )}
        />
      ))}
    </span>
  );
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
  const [related, comments] = await Promise.all([
    getRelatedMovies(movie.id, genreIds),
    getComments(movie.id),
  ]);
  const commentCount = comments.reduce((s, c) => s + 1 + c.replies.length, 0);

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

  // Có nguồn phát thật không (trailer/phim full)? Nếu không thì ẩn nút "Xem ngay".
  const hasPlayable =
    movie.type === "TV"
      ? movie.seasons.some((s) => s.episodes.some((e) => e.videoSources.length > 0))
      : movie.videoSources.length > 0;

  return (
    <div className="pb-12">
      {/* Banner lớn, mờ dần xuống nền sáng */}
      <div className="relative h-[56vh] min-h-[440px] w-full overflow-hidden">
        <Image
          src={backdropUrl(movie.backdropPath)}
          alt={movie.title}
          fill
          priority
          sizes="100vw"
          className="animate-kenburns scale-105 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-background)] via-[var(--color-background)]/80 to-[var(--color-background)]/15" />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-background)]/70 to-transparent" />
      </div>

      <div className="mx-auto max-w-[1400px] px-4 md:px-8">
        <div className="-mt-36 flex flex-col gap-8 md:-mt-48 md:flex-row">
          {/* Poster (đè lên banner) */}
          <div className="relative mx-auto aspect-[2/3] w-48 shrink-0 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-muted)] shadow-2xl shadow-black/25 md:mx-0 md:w-72">
            <Image
              src={posterUrl(movie.posterPath)}
              alt={movie.title}
              fill
              sizes="(max-width: 768px) 50vw, 288px"
              className="object-cover"
            />
          </div>

          {/* Thông tin (nằm dưới banner, trên nền sáng) */}
          <div className="flex-1 md:pt-48">
            <h1 className="font-serif text-4xl font-bold tracking-tight md:text-6xl">
              {movie.title}
            </h1>
            {movie.originalTitle && movie.originalTitle !== movie.title && (
              <p className="mt-1 text-[var(--color-muted-foreground)]">
                {movie.originalTitle}
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-[var(--color-muted-foreground)]">
              <span className="flex items-center gap-1 font-medium text-[var(--color-foreground)]">
                <Star className="size-4 fill-amber-500 text-amber-500" />
                {movie.voteAverage.toFixed(1)}
                {avgRating !== null && (
                  <span className="ml-1 font-normal text-[var(--color-muted-foreground)]">
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
                  <Badge className="transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]">
                    {g.genre.name}
                  </Badge>
                </Link>
              ))}
            </div>

            <p className="mt-5 max-w-3xl text-base leading-relaxed text-[var(--color-muted-foreground)]">
              {movie.overview ?? "Chưa có mô tả."}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              {hasPlayable ? (
                <Link
                  href={`/xem/${movie.slug}`}
                  className={buttonVariants({ variant: "default", size: "lg" })}
                >
                  <Play className="fill-current" /> Xem ngay
                </Link>
              ) : (
                <span
                  className={`${buttonVariants({ variant: "outline", size: "lg" })} cursor-not-allowed opacity-60`}
                  title="Phim này chưa có nguồn phát hợp pháp"
                >
                  Chưa có nguồn phát
                </span>
              )}
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

        <Reveal className="mt-12 space-y-12">
          {/* Trailer */}
          {movie.trailerKey && (
            <section>
              <SectionTitle>Trailer</SectionTitle>
              <div className="aspect-video w-full max-w-3xl overflow-hidden rounded-xl border border-[var(--color-border)]">
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
              <SectionTitle>Danh sách tập</SectionTitle>
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
                        className="rounded-md border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
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
              <SectionTitle>Diễn viên</SectionTitle>
              <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2">
                {movie.cast.map((c) => (
                  <div key={c.id} className="w-24 shrink-0 text-center">
                    <div className="relative mx-auto aspect-[2/3] w-24 overflow-hidden rounded-lg border border-[var(--color-border)]">
                      <Image
                        src={profileUrl(c.person.profilePath)}
                        alt={c.person.name}
                        fill
                        sizes="96px"
                        className="object-cover"
                      />
                    </div>
                    <p className="mt-2 line-clamp-2 text-xs font-medium">
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
            <SectionTitle>Đánh giá &amp; bình luận</SectionTitle>

            {/* Tổng quan điểm */}
            <div className="mb-6 flex flex-col items-center gap-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 sm:flex-row sm:gap-8">
              <div className="text-center">
                <div className="font-serif text-5xl font-bold leading-none">
                  {(avgRating ?? movie.voteAverage).toFixed(1)}
                </div>
                <StarRow
                  value={avgRating ?? movie.voteAverage}
                  className="mt-2 justify-center"
                />
                <p className="mt-1.5 text-xs text-[var(--color-muted-foreground)]">
                  {movie.reviews.length} đánh giá
                </p>
              </div>
              <div className="hidden h-16 w-px bg-[var(--color-border)] sm:block" />
              <div className="flex-1 text-sm leading-relaxed text-[var(--color-muted-foreground)]">
                {movie.reviews.length === 0
                  ? "Chưa có đánh giá nào — hãy là người đầu tiên chia sẻ cảm nhận về phim!"
                  : "Cảm nhận từ cộng đồng người xem MovieStream."}
                <div className="mt-2 flex items-center gap-1.5 text-[var(--color-foreground)]">
                  <Star className="size-4 fill-amber-500 text-amber-500" />
                  <span className="font-medium">
                    {movie.voteAverage.toFixed(1)}/10
                  </span>
                  <span className="text-[var(--color-muted-foreground)]">
                    điểm TMDB
                  </span>
                </div>
              </div>
            </div>

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
              <p className="mb-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)] px-4 py-3 text-sm text-[var(--color-muted-foreground)]">
                <Link
                  href={`/dang-nhap?callbackUrl=/phim/${movie.slug}`}
                  className="font-medium text-[var(--color-primary)] hover:underline"
                >
                  Đăng nhập
                </Link>{" "}
                để viết đánh giá.
              </p>
            )}

            {movie.reviews.length > 0 && (
              <ul className="space-y-3">
                {movie.reviews.map((r) => (
                  <li
                    key={r.id}
                    className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 transition-colors hover:border-[var(--color-muted-foreground)]/40"
                  >
                    <div className="flex items-start gap-3">
                      <div className="size-10 shrink-0 overflow-hidden rounded-full border border-[var(--color-border)] bg-[var(--color-muted)]">
                        {r.user.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={r.user.image}
                            alt={r.user.name ?? ""}
                            className="size-full object-cover"
                          />
                        ) : (
                          <div className="flex size-full items-center justify-center text-sm font-bold text-[var(--color-muted-foreground)]">
                            {(r.user.name ?? "U").charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                          <div className="flex items-baseline gap-2">
                            <span className="font-medium">
                              {r.user.name ?? "Người dùng"}
                            </span>
                            <span className="text-xs text-[var(--color-muted-foreground)]">
                              {new Date(r.createdAt).toLocaleDateString("vi-VN")}
                            </span>
                          </div>
                          <span className="inline-flex items-center gap-1.5">
                            <StarRow value={r.rating} />
                            <span className="text-sm font-semibold tabular-nums">
                              {r.rating}/10
                            </span>
                          </span>
                        </div>
                        {r.comment && (
                          <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted-foreground)]">
                            {r.comment}
                          </p>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Bình luận / thảo luận */}
          <section id="binh-luan">
            <SectionTitle>Bình luận ({commentCount})</SectionTitle>
            <CommentSection
              comments={comments}
              movieId={movie.id}
              slug={movie.slug}
              currentUserId={user?.id}
              isAdmin={user?.role === "ADMIN"}
              isLoggedIn={Boolean(user)}
            />
          </section>
        </Reveal>
      </div>

      {/* Phim liên quan */}
      {related.length > 0 && (
        <div className="mt-14">
          <MovieRow title="Phim liên quan" movies={related} />
        </div>
      )}
    </div>
  );
}
