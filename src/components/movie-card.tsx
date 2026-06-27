import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";
import { posterUrl } from "@/lib/images";
import { getYear } from "@/lib/utils";

export type CardMovie = {
  slug: string;
  title: string;
  posterPath: string | null;
  voteAverage: number;
  releaseDate: Date | null;
  type: "MOVIE" | "TV";
};

export function MovieCard({
  movie,
  className = "",
}: {
  movie: CardMovie;
  className?: string;
}) {
  return (
    <Link
      href={`/phim/${movie.slug}`}
      className={`group block ${className}`}
      title={movie.title}
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-md bg-[var(--color-muted)] ring-1 ring-white/5">
        <Image
          src={posterUrl(movie.posterPath)}
          alt={movie.title}
          fill
          sizes="(max-width: 640px) 40vw, 180px"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {movie.type === "TV" && (
          <span className="absolute left-2 top-2 rounded bg-[var(--color-primary)] px-1.5 py-0.5 text-[10px] font-semibold text-white">
            Phim bộ
          </span>
        )}
        <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded bg-black/70 px-1.5 py-0.5 text-[11px] font-medium">
          <Star className="size-3 fill-yellow-400 text-yellow-400" />
          {movie.voteAverage.toFixed(1)}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      <h3 className="mt-2 line-clamp-2 text-sm font-medium leading-snug transition-colors group-hover:text-[var(--color-primary)]">
        {movie.title}
      </h3>
      <p className="text-xs text-[var(--color-muted-foreground)]">
        {getYear(movie.releaseDate)}
      </p>
    </Link>
  );
}
