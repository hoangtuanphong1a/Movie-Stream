import Link from "next/link";
import { Film, Eye, Users, Star, CheckCircle } from "lucide-react";
import { getAdminStats, getRecentMovies } from "@/lib/admin-queries";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const stats = await getAdminStats();
  const recent = await getRecentMovies(8);

  const cards = [
    { label: "Tổng phim", value: stats.movies, icon: Film },
    { label: "Đã xuất bản", value: stats.published, icon: CheckCircle },
    { label: "Người dùng", value: stats.users, icon: Users },
    { label: "Đánh giá", value: stats.reviews, icon: Star },
    { label: "Lượt xem", value: stats.totalViews, icon: Eye },
  ];

  return (
    <div>
      <h1 className="mb-6 font-serif text-3xl font-bold tracking-tight">Dashboard</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4"
          >
            <c.icon className="mb-2 size-5 text-[var(--color-primary)]" />
            <div className="text-2xl font-bold">{c.value}</div>
            <div className="text-xs text-[var(--color-muted-foreground)]">
              {c.label}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Phim mới thêm</h2>
          <Link
            href="/admin/phim"
            className="text-sm text-[var(--color-primary)] hover:underline"
          >
            Xem tất cả →
          </Link>
        </div>
        <div className="overflow-hidden rounded-lg border border-[var(--color-border)]">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-card)] text-left text-[var(--color-muted-foreground)]">
              <tr>
                <th className="p-3">Tên phim</th>
                <th className="p-3">Loại</th>
                <th className="p-3">Trạng thái</th>
                <th className="p-3">Thể loại</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((m) => (
                <tr
                  key={m.id}
                  className="border-t border-[var(--color-border)]"
                >
                  <td className="p-3">
                    <Link
                      href={`/admin/phim/${m.id}`}
                      className="hover:text-[var(--color-primary)]"
                    >
                      {m.title}
                    </Link>
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
                    {m.genres.map((g) => g.genre.name).join(", ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
