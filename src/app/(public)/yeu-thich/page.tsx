import type { Metadata } from "next";
import { requireUser } from "@/lib/session";
import { getFavorites } from "@/lib/queries";
import { MovieGrid } from "@/components/movie-grid";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Phim yêu thích" };

export default async function FavoritesPage() {
  const user = await requireUser();
  const favorites = await getFavorites(user.id);

  return (
    <div className="mx-auto max-w-[1600px] py-6">
      <h1 className="mb-6 px-4 font-serif text-3xl font-bold tracking-tight md:px-8">
        Phim yêu thích
      </h1>
      <MovieGrid movies={favorites.map((f) => f.movie)} />
    </div>
  );
}
