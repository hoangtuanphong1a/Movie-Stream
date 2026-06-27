import type { Metadata } from "next";
import Link from "next/link";
import { browseMovies, getGenresWithCount, type SortOption } from "@/lib/queries";
import { MovieGrid } from "@/components/movie-grid";
import { BrowseFilters } from "@/components/browse-filters";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Duyệt phim" };

/** Bỏ tiền tố "Phim " cho gọn (vd "Phim Hành Động" → "Hành Động"). */
function shortGenre(name: string) {
  return name.replace(/^Phim\s+/i, "");
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
    getGenresWithCount(),
    browseMovies({ genre, year, type, sort, page }),
  ]);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1989 }, (_, i) => currentYear - i);

  function buildHref(opts: { genre?: string | null; page?: number }) {
    const g = opts.genre === undefined ? genre : opts.genre || undefined;
    const p = new URLSearchParams();
    if (g) p.set("the-loai", g);
    if (year) p.set("nam", String(year));
    if (type) p.set("loai", type);
    if (sort !== "newest") p.set("sap-xep", sort);
    const pg = opts.page ?? 1;
    if (pg > 1) p.set("trang", String(pg));
    const qs = p.toString();
    return `/duyet${qs ? `?${qs}` : ""}`;
  }

  const hasFilters = Boolean(genre || year || type);
  const activeGenre = genres.find((g) => g.slug === genre);

  const itemBase =
    "flex shrink-0 items-center justify-between gap-2 whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-medium transition-colors lg:rounded-lg";
  const itemOn = "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]";
  const itemOff =
    "border border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-accent)] hover:text-[var(--color-foreground)] lg:border-transparent";

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-6 md:px-8">
      {/* Tiêu đề */}
      <header className="border-b border-[var(--color-border)] pb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--color-primary)]">
          Thư viện phim
        </p>
        <h1 className="mt-2 font-serif text-4xl font-bold tracking-tight md:text-5xl">
          Duyệt phim
        </h1>
        <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
          {result.total} phim · {genres.length} thể loại — lọc theo thể loại, năm và loại phim.
        </p>
      </header>

      <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:gap-8">
        {/* Sidebar thể loại (dọc trên desktop, cuộn ngang trên mobile) */}
        <aside className="lg:w-56 lg:shrink-0">
          <h2 className="mb-2 hidden text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)] lg:block">
            Thể loại
          </h2>
          <nav className="no-scrollbar flex gap-2 overflow-x-auto pb-1 lg:max-h-[calc(100vh-7rem)] lg:flex-col lg:gap-0.5 lg:overflow-y-auto lg:pb-0">
            <Link
              href={buildHref({ genre: null })}
              className={`${itemBase} ${!genre ? itemOn : itemOff}`}
            >
              <span>Tất cả</span>
              <span className="text-xs opacity-60">{result.total}</span>
            </Link>
            {genres.map((g) => (
              <Link
                key={g.slug}
                href={buildHref({ genre: g.slug })}
                className={`${itemBase} ${genre === g.slug ? itemOn : itemOff}`}
              >
                <span>{shortGenre(g.name)}</span>
                <span className="text-xs opacity-60">{g.count}</span>
              </Link>
            ))}
          </nav>
        </aside>

        {/* Cột nội dung */}
        <div className="min-w-0 flex-1">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-[var(--color-muted-foreground)]">
              <span className="font-semibold text-[var(--color-foreground)]">
                {result.total}
              </span>{" "}
              kết quả
              {activeGenre && (
                <>
                  {" "}
                  trong{" "}
                  <span className="font-semibold text-[var(--color-foreground)]">
                    {shortGenre(activeGenre.name)}
                  </span>
                </>
              )}
            </p>
            <div className="flex flex-wrap items-center gap-2.5">
              <BrowseFilters years={years} />
              {hasFilters && (
                <Link
                  href="/duyet"
                  className="inline-flex h-9 items-center gap-1.5 rounded-md border border-[var(--color-border)] px-3 text-sm transition-colors hover:bg-[var(--color-accent)]"
                >
                  ✕ Xóa lọc
                </Link>
              )}
            </div>
          </div>

          {/* Lưới phim */}
          <div className="mt-5">
            {result.items.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[var(--color-border)] py-20 text-center">
                <p className="text-[var(--color-muted-foreground)]">
                  Không tìm thấy phim phù hợp.
                </p>
                <Link
                  href="/duyet"
                  className="mt-3 inline-block text-sm font-medium text-[var(--color-primary)] hover:underline"
                >
                  Xóa bộ lọc
                </Link>
              </div>
            ) : (
              <MovieGrid movies={result.items} />
            )}
          </div>

          {/* Phân trang */}
          {result.totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-3">
              {page > 1 ? (
                <Link
                  href={buildHref({ page: page - 1 })}
                  className="rounded-md border border-[var(--color-border)] px-4 py-2 text-sm transition-colors hover:bg-[var(--color-accent)]"
                >
                  ← Trước
                </Link>
              ) : (
                <span className="rounded-md border border-[var(--color-border)] px-4 py-2 text-sm opacity-40">
                  ← Trước
                </span>
              )}
              <span className="px-2 text-sm text-[var(--color-muted-foreground)]">
                Trang{" "}
                <span className="font-semibold text-[var(--color-foreground)]">
                  {page}
                </span>{" "}
                / {result.totalPages}
              </span>
              {page < result.totalPages ? (
                <Link
                  href={buildHref({ page: page + 1 })}
                  className="rounded-md border border-[var(--color-border)] px-4 py-2 text-sm transition-colors hover:bg-[var(--color-accent)]"
                >
                  Sau →
                </Link>
              ) : (
                <span className="rounded-md border border-[var(--color-border)] px-4 py-2 text-sm opacity-40">
                  Sau →
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
