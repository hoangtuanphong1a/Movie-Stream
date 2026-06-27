import { MovieCard, type CardMovie } from "./movie-card";

export function MovieGrid({ movies }: { movies: CardMovie[] }) {
  if (movies.length === 0) {
    return (
      <p className="px-4 py-16 text-center text-[var(--color-muted-foreground)]">
        Không tìm thấy phim nào.
      </p>
    );
  }
  return (
    <div className="grid grid-cols-3 gap-3 px-4 sm:grid-cols-4 md:grid-cols-5 md:px-8 lg:grid-cols-6 xl:grid-cols-7">
      {movies.map((m) => (
        <MovieCard key={m.slug} movie={m} />
      ))}
    </div>
  );
}
