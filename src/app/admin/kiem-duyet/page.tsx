import Link from "next/link";
import { Star, MessageSquare, Eye, EyeOff } from "lucide-react";
import { listReviewsAdmin } from "@/lib/admin-queries";
import { ReviewActions } from "@/components/admin/review-actions";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

const SELECT_CLASS =
  "h-9 rounded-md border border-[var(--color-border)] bg-[var(--color-card)] px-3 text-sm outline-none focus:border-[var(--color-primary)]";

function buildHref(
  params: { "trang-thai"?: string; q?: string },
  trang: number,
) {
  const sp = new URLSearchParams();
  if (params["trang-thai"]) sp.set("trang-thai", params["trang-thai"]);
  if (params.q) sp.set("q", params.q);
  if (trang > 1) sp.set("trang", String(trang));
  const qs = sp.toString();
  return `/admin/kiem-duyet${qs ? `?${qs}` : ""}`;
}

export default async function ModerationPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const str = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");

  const statusRaw = str("trang-thai");
  const status =
    statusRaw === "VISIBLE" || statusRaw === "HIDDEN" ? statusRaw : undefined;
  const q = str("q");
  const page = Math.max(1, Number(str("trang")) || 1);

  const result = await listReviewsAdmin({ status, q, page });
  const filterParams = { "trang-thai": statusRaw, q };

  const statCards = [
    { label: "Tổng đánh giá", value: result.counts.total, icon: MessageSquare },
    { label: "Đang hiển thị", value: result.counts.visible, icon: Eye },
    { label: "Đã ẩn", value: result.counts.hidden, icon: EyeOff },
  ];

  return (
    <div>
      <h1 className="mb-6 font-serif text-3xl font-bold tracking-tight">
        Kiểm duyệt đánh giá
      </h1>

      {/* Thống kê */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        {statCards.map((c) => (
          <div
            key={c.label}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4"
          >
            <c.icon className="mb-2 size-5 text-[var(--color-muted-foreground)]" />
            <div className="text-2xl font-bold">{c.value}</div>
            <div className="text-xs text-[var(--color-muted-foreground)]">
              {c.label}
            </div>
          </div>
        ))}
      </div>

      {/* Lọc + tìm kiếm */}
      <form method="get" className="mb-4 flex flex-wrap items-center gap-3">
        <select name="trang-thai" defaultValue={statusRaw} className={SELECT_CLASS}>
          <option value="">Tất cả trạng thái</option>
          <option value="VISIBLE">Đang hiển thị</option>
          <option value="HIDDEN">Đã ẩn</option>
        </select>
        <input
          name="q"
          defaultValue={q}
          placeholder="Tìm theo bình luận, người dùng, phim..."
          className="h-9 w-64 rounded-md border border-[var(--color-border)] bg-[var(--color-card)] px-3 text-sm outline-none focus:border-[var(--color-primary)]"
        />
        <button
          type="submit"
          className="h-9 rounded-md bg-[var(--color-primary)] px-4 text-sm font-medium text-white hover:opacity-90"
        >
          Lọc
        </button>
        {(statusRaw || q) && (
          <Link
            href="/admin/kiem-duyet"
            className="h-9 rounded-md border border-[var(--color-border)] px-4 text-sm leading-9 hover:bg-[var(--color-accent)]"
          >
            Xóa lọc
          </Link>
        )}
      </form>

      {result.items.length === 0 ? (
        <p className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-8 text-center text-[var(--color-muted-foreground)]">
          Không có đánh giá phù hợp.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--color-border)]">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-card)] text-left text-[var(--color-muted-foreground)]">
              <tr>
                <th className="p-3">Phim</th>
                <th className="p-3">Người dùng</th>
                <th className="p-3">Điểm</th>
                <th className="p-3">Bình luận</th>
                <th className="p-3">Ngày</th>
                <th className="p-3">Trạng thái</th>
                <th className="p-3">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((r) => (
                <tr key={r.id} className="border-t border-[var(--color-border)] align-top">
                  <td className="p-3 font-medium">
                    <Link
                      href={`/phim/${r.movie.slug}`}
                      className="hover:text-[var(--color-primary)]"
                    >
                      {r.movie.title}
                    </Link>
                  </td>
                  <td className="p-3">
                    <div>{r.user.name ?? "—"}</div>
                    <div className="text-xs text-[var(--color-muted-foreground)]">
                      {r.user.email}
                    </div>
                  </td>
                  <td className="p-3">
                    <span className="inline-flex items-center gap-1 font-medium">
                      <Star className="size-3.5 fill-amber-500 text-amber-500" />
                      {r.rating}/10
                    </span>
                  </td>
                  <td className="max-w-xs p-3 text-[var(--color-muted-foreground)]">
                    {r.comment ? (
                      <span className="line-clamp-2">{r.comment}</span>
                    ) : (
                      <span className="italic">(không có)</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap p-3 text-[var(--color-muted-foreground)]">
                    {new Date(r.createdAt).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="p-3">
                    {r.status === "HIDDEN" ? (
                      <Badge className="border-red-500/40 text-red-500">Đã ẩn</Badge>
                    ) : (
                      <Badge>Hiển thị</Badge>
                    )}
                  </td>
                  <td className="p-3">
                    <ReviewActions id={r.id} status={r.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Phân trang */}
      {result.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
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
