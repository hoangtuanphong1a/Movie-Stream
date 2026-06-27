import type { Metadata } from "next";
import Link from "next/link";
import { browseMovies, getAllGenres, type SortOption } from "@/lib/queries";
import { MovieGrid } from "@/components/movie-grid";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Duyệt phim" };

const SELECT_CLASS =
  "h-9 rounded-md border border-[var(--color-border)] bg-[var(--color-muted)] px-3 text-sm outline-none focus:border-[var(--color-primary)]";

function buildHref(
  params: Record<string, string | number | undefined>,
  trang: number,
) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") sp.set(k, String(v));
  }
  if (trang > 1) sp.set("trang", String(trang));
  const qs = sp.toString();
  return `/duyet${qs ? `?${qs}` : ""}`;
}

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const str = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");

  const genre = str("the-loai") || undefined;
  const yearStr = str("nam");
  const year = yearStr ? Number(yearStr) || undefined : undefined;
  const loai = str("loai");
  const type = loai === "MOVIE" || loai === "TV" ? loai : undefined;
  const sapXep = str("sap-xep");
  const sort: SortOption = (["newest", "rating", "title"].includes(sapXep)
    ? sapXep
    : "newest") as SortOption;
  const page = Math.max(1, Number(str("trang")) || 1);

  const [genres, result] = await Promise.all([
    getAllGenres(),
    browseMovies({ genre, year, type, sort, page }),
  ]);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1989 }, (_, i) => currentYear - i);
  const filterParams = {
    "the-loai": genre,
    nam: year,
    loai: type,
    "sap-xep": sort,
  };

  return (
    <div className="mx-auto max-w-[1600px] py-6">
      <div className="px-4 md:px-8">
        <h1 className="text-2xl font-bold">Duyệt phim</h1>

        <form method="get" className="mt-4 flex flex-wrap items-center gap-3">
          <select name="the-loai" defaultValue={genre ?? ""} className={SELECT_CLASS}>
            <option value="">Tất cả thể loại</option>
            {genres.map((g) => (
              <option key={g.id} value={g.slug}>
                {g.name}
              </option>
            ))}
          </select>

          <select name="nam" defaultValue={yearStr} className={SELECT_CLASS}>
            <option value="">Tất cả năm</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          <select name="loai" defaultValue={type ?? ""} className={SELECT_CLASS}>
            <option value="">Phim lẻ & bộ</option>
            <option value="MOVIE">Phim lẻ</option>
            <option value="TV">Phim bộ</option>
          </select>

          <select name="sap-xep" defaultValue={sort} className={SELECT_CLASS}>
            <option value="newest">Mới nhất</option>
            <option value="rating">Điểm cao</option>
            <option value="title">Tên A→Z</option>
          </select>

          <button
            type="submit"
            className="h-9 rounded-md bg-[var(--color-primary)] px-4 text-sm font-medium text-white hover:opacity-90"
          >
            Lọc
          </button>
          <Link
            href="/duyet"
            className="h-9 rounded-md border border-[var(--color-border)] px-4 text-sm leading-9 hover:bg-[var(--color-accent)]"
          >
            Xóa lọc
          </Link>
        </form>

        <p className="mt-3 text-sm text-[var(--color-muted-foreground)]">
          {result.total} phim
        </p>
      </div>

      <div className="mt-6">
        <MovieGrid movies={result.items} />
      </div>

      {result.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2 px-4">
          {page > 1 && (
            <Link
              href={buildHref(filterParams, page - 1)}
              className="rounded-md border border-[var(--color-border)] px-3 py-2 text-sm hover:bg-[var(--color-accent)]"
            >
              ← Trước
            </Link>
          )}
          <span className="px-2 text-sm text-[var(--color-muted-foreground)]">
            Trang {page}/{result.totalPages}
          </span>
          {page < result.totalPages && (
            <Link
              href={buildHref(filterParams, page + 1)}
              className="rounded-md border border-[var(--color-border)] px-3 py-2 text-sm hover:bg-[var(--color-accent)]"
            >
              Sau →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
