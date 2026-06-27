import { getHomeData } from "@/lib/queries";
import { Hero } from "@/components/hero";
import { MovieRow } from "@/components/movie-row";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { featured, trending, newest, genreRows } = await getHomeData();
  const hero = featured[0];

  return (
    <div className="pb-8">
      {hero && <Hero movie={hero} />}

      <div className="relative z-10 -mt-10 space-y-8 md:-mt-16">
        <MovieRow title="Thịnh hành" movies={trending} href="/duyet?sap-xep=rating" />
        <MovieRow title="Mới cập nhật" movies={newest} href="/duyet" />
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
