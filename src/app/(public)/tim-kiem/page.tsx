import type { Metadata } from "next";
import { searchMovies } from "@/lib/queries";
import { MovieGrid } from "@/components/movie-grid";
import { SearchBox } from "@/components/search-box";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Tìm kiếm" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const results = q ? await searchMovies(q) : [];

  return (
    <div className="mx-auto max-w-[1600px] py-6">
      <div className="px-4 md:px-8">
        <h1 className="mb-4 font-serif text-3xl font-bold tracking-tight">Tìm kiếm</h1>
        <div className="max-w-xl">
          <SearchBox initial={q} />
        </div>
        {q && (
          <p className="mt-3 text-sm text-[var(--color-muted-foreground)]">
            {results.length} kết quả cho “{q}”
          </p>
        )}
      </div>
      <div className="mt-6">
        <MovieGrid movies={results} />
      </div>
    </div>
  );
}
