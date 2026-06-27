import type { Metadata } from "next";
import { requireUser } from "@/lib/session";
import { getWatchlist } from "@/lib/queries";
import { MovieGrid } from "@/components/movie-grid";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Xem sau" };

export default async function WatchlistPage() {
  const user = await requireUser();
  const watchlist = await getWatchlist(user.id);

  return (
    <div className="mx-auto max-w-[1600px] py-6">
      <h1 className="mb-6 px-4 font-serif text-3xl font-bold tracking-tight md:px-8">
        Danh sách xem sau
      </h1>
      <MovieGrid movies={watchlist.map((w) => w.movie)} />
    </div>
  );
}
