import Link from "next/link";
import Image from "next/image";
import { Plus } from "lucide-react";
import { listMoviesAdmin } from "@/lib/admin-queries";
import { posterUrl } from "@/lib/images";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { MovieRowActions } from "@/components/admin/movie-row-actions";

export const dynamic = "force-dynamic";

export default async function AdminMoviesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const page = Math.max(
    1,
    Number(typeof sp.trang === "string" ? sp.trang : "1") || 1,
  );
  const { items, total, totalPages } = await listMoviesAdmin({ q, page });

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Quản lý phim ({total})</h1>
        <Link
          href="/admin/phim/moi"
          className={buttonVariants({ size: "sm" })}
        >
          <Plus className="size-4" /> Thêm phim
        </Link>
      </div>

      <form method="get" className="mb-4 flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Tìm theo tên phim..."
          className="h-9 w-64 rounded-md border border-[var(--color-border)] bg-[var(--color-muted)] px-3 text-sm"
        />
        <button
          type="submit"
          className="h-9 rounded-md bg-[var(--color-primary)] px-4 text-sm font-medium text-white"
        >
          Tìm
        </button>
      </form>

      <div className="overflow-x-auto rounded-lg border border-[var(--color-border)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-card)] text-left text-[var(--color-muted-foreground)]">
            <tr>
              <th className="p-3">Phim</th>
              <th className="p-3">Loại</th>
              <th className="p-3">Trạng thái</th>
              <th className="p-3">Nguồn</th>
              <th className="p-3">Lượt xem</th>
              <th className="p-3">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {items.map((m) => (
              <tr key={m.id} className="border-t border-[var(--color-border)]">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded">
                      <Image
                        src={posterUrl(m.posterPath)}
                        alt={m.title}
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <Link
                        href={`/admin/phim/${m.id}`}
                        className="font-medium hover:text-[var(--color-primary)]"
                      >
                        {m.title}
                      </Link>
                      {m.featured && (
                        <span className="ml-2 text-xs text-yellow-400">
                          ★ Nổi bật
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  {m.type === "TV" ? "Phim bộ" : "Phim lẻ"}
                </td>
                <td className="p-3">
                  <Badge>
                    {m.status === "PUBLISHED" ? "Xuất bản" : "Nháp"}
                  </Badge>
                </td>
                <td className="p-3 text-[var(--color-muted-foreground)]">
                  {m._count.videoSources}
                </td>
                <td className="p-3 text-[var(--color-muted-foreground)]">
                  {m.viewCount}
                </td>
                <td className="p-3">
                  <MovieRowActions
                    id={m.id}
                    status={m.status}
                    featured={m.featured}
                  />
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="p-6 text-center text-[var(--color-muted-foreground)]"
                >
                  Không có phim nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {page > 1 && (
            <Link
              href={`/admin/phim?${new URLSearchParams({ ...(q ? { q } : {}), trang: String(page - 1) })}`}
              className="rounded-md border border-[var(--color-border)] px-3 py-1.5 text-sm"
            >
              ← Trước
            </Link>
          )}
          <span className="text-sm text-[var(--color-muted-foreground)]">
            Trang {page}/{totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/admin/phim?${new URLSearchParams({ ...(q ? { q } : {}), trang: String(page + 1) })}`}
              className="rounded-md border border-[var(--color-border)] px-3 py-1.5 text-sm"
            >
              Sau →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
