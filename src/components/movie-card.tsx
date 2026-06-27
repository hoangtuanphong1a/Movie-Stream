import Link from "next/link";
import Image from "next/image";
import { Star, Play } from "lucide-react";
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
  priority = false,
}: {
  movie: CardMovie;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Link
      href={`/phim/${movie.slug}`}
      className={`group block [perspective:1000px] ${className}`}
      title={movie.title}
    >
      {/* Sân khấu 3D — giữ không gian phối cảnh cho các lớp con */}
      <div className="relative aspect-[2/3] [transform-style:preserve-3d]">
        {/* COVER (poster) — ngả ra sau khi hover, gốc xoay ở đáy */}
        <div className="absolute inset-0 origin-bottom overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)] shadow-sm transition-[transform,box-shadow] duration-500 ease-out [transform:rotateX(0deg)] group-hover:[transform:translateY(-6px)_rotateX(15deg)] group-hover:shadow-2xl group-hover:shadow-black/40">
          <Image
            src={posterUrl(movie.posterPath)}
            alt={movie.title}
            fill
            priority={priority}
            sizes="(max-width: 640px) 40vw, 180px"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
          {/* Phủ tối dần từ đáy để chữ/nút nổi rõ khi hover */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        </div>

        {/* Nhãn Phim bộ — nổi nhẹ về phía trước */}
        {movie.type === "TV" && (
          <span className="pointer-events-none absolute left-2 top-2 rounded-md bg-[var(--color-primary)] px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-md transition-transform duration-500 [transform:translateZ(20px)] group-hover:[transform:translate3d(0,-4px,60px)]">
            Phim bộ
          </span>
        )}

        {/* Điểm số — nổi về phía trước khi hover */}
        <span className="pointer-events-none absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-md bg-[var(--color-secondary)]/90 px-1.5 py-0.5 text-[11px] font-medium text-white shadow-md backdrop-blur-sm transition-transform duration-500 [transform:translateZ(20px)] group-hover:[transform:translate3d(0,-6px,70px)]">
          <Star className="size-3 fill-amber-400 text-amber-400" />
          {movie.voteAverage.toFixed(1)}
        </span>

        {/* Nút "Xem" — bật hẳn ra trước mặt poster khi hover */}
        <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center opacity-0 transition-all duration-500 [transform:translateZ(0)] group-hover:opacity-100 group-hover:[transform:translate3d(0,-2px,90px)]">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-primary)] px-3 py-1 text-xs font-semibold text-white shadow-xl shadow-black/30">
            <Play className="size-3 fill-current" /> Xem
          </span>
        </div>
      </div>

      <h3 className="mt-2.5 line-clamp-1 text-sm font-medium text-[var(--color-foreground)] transition-colors group-hover:text-[var(--color-primary)]">
        {movie.title}
      </h3>
      <p className="text-xs text-[var(--color-muted-foreground)]">
        {getYear(movie.releaseDate)}
      </p>
    </Link>
  );
}
