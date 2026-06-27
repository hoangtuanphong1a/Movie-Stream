import { getHomeData } from "@/lib/queries";
import { HeroCarousel } from "@/components/hero-carousel";
import { MovieRow } from "@/components/movie-row";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { featured, trending, newest, topRated, tvShows, classics, genreRows } =
    await getHomeData();

  return (
    <div className="pb-8">
      {featured.length > 0 && <HeroCarousel movies={featured} />}

      <div className="space-y-12 py-12">
        {classics.length > 0 && (
          <MovieRow
            title="Phim kinh điển · Xem full miễn phí"
            movies={classics}
            href="/duyet?the-loai=phim-kinh-dien"
            priorityCount={6}
          />
        )}
        <MovieRow
          title="Thịnh hành"
          movies={trending}
          href="/duyet?sap-xep=rating"
        />
        <MovieRow title="Mới cập nhật" movies={newest} href="/duyet" />
        <MovieRow
          title="Đánh giá cao"
          movies={topRated}
          href="/duyet?sap-xep=rating"
        />
        {tvShows.length > 0 && (
          <MovieRow
            title="Phim bộ"
            movies={tvShows}
            href="/duyet?loai=TV"
          />
        )}
        {genreRows.map(({ genre, movies }) => (
          <MovieRow
            key={genre.id}
            title={genre.name}
            movies={movies}
            href={`/duyet?the-loai=${genre.slug}`}
          />
        ))}
      </div>
    </div>
  );
}
