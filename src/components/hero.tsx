import Link from "next/link";
import Image from "next/image";
import { Play, Info, Star } from "lucide-react";
import { backdropUrl } from "@/lib/images";
import { buttonVariants } from "@/components/ui/button";
import { getYear } from "@/lib/utils";

type HeroMovie = {
  slug: string;
  title: string;
  overview: string | null;
  backdropPath: string | null;
  voteAverage: number;
  releaseDate: Date | null;
  genres: { genre: { name: string } }[];
};

export function Hero({ movie }: { movie: HeroMovie }) {
  return (
    <section className="relative h-[70vh] min-h-[420px] w-full">
      <Image
        src={backdropUrl(movie.backdropPath)}
        alt={movie.title}
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-background)] via-[var(--color-background)]/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-background)]/90 via-transparent to-transparent" />

      <div className="absolute bottom-0 left-0 w-full p-4 md:p-12">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold drop-shadow-lg md:text-5xl">
            {movie.title}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-[var(--color-muted-foreground)]">
            <span className="flex items-center gap-1 text-yellow-400">
              <Star className="size-4 fill-yellow-400" />
              {movie.voteAverage.toFixed(1)}
            </span>
            <span>{getYear(movie.releaseDate)}</span>
            <span>{movie.genres.map((g) => g.genre.name).join(" · ")}</span>
          </div>
          <p className="mt-3 line-clamp-3 text-sm text-gray-200 md:text-base">
            {movie.overview}
          </p>
          <div className="mt-5 flex gap-3">
            <Link
              href={`/xem/${movie.slug}`}
              className={buttonVariants({ variant: "white", size: "lg" })}
            >
              <Play className="fill-black" /> Xem ngay
            </Link>
            <Link
              href={`/phim/${movie.slug}`}
              className={buttonVariants({ variant: "secondary", size: "lg" })}
            >
              <Info /> Chi tiết
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
