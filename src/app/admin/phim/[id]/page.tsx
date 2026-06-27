import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Clapperboard } from "lucide-react";
import { getMovieForEdit, listGenresAdmin } from "@/lib/admin-queries";
import { MovieForm } from "@/components/admin/movie-form";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function EditMoviePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [movie, genres] = await Promise.all([
    getMovieForEdit(id),
    listGenresAdmin(),
  ]);
  if (!movie) notFound();

  return (
    <div>
      <Link
        href="/admin/phim"
        className="mb-4 inline-flex items-center gap-1 text-sm text-[var(--color-muted-foreground)] hover:text-white"
      >
        <ChevronLeft className="size-4" /> Danh sách phim
      </Link>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Sửa: {movie.title}</h1>
        <Link
          href={`/admin/phim/${movie.id}/nguon`}
          className={buttonVariants({ variant: "secondary", size: "sm" })}
        >
          <Clapperboard className="size-4" /> Quản lý nguồn phát
        </Link>
      </div>

      <MovieForm
        genres={genres.map((g) => ({ id: g.id, name: g.name }))}
        initial={{
          id: movie.id,
          title: movie.title,
          slug: movie.slug,
          overview: movie.overview,
          posterPath: movie.posterPath,
          backdropPath: movie.backdropPath,
          releaseDate: movie.releaseDate,
          runtime: movie.runtime,
          voteAverage: movie.voteAverage,
          trailerKey: movie.trailerKey,
          type: movie.type,
          status: movie.status,
          featured: movie.featured,
          genreIds: movie.genres.map((g) => g.genreId),
        }}
      />
    </div>
  );
}
