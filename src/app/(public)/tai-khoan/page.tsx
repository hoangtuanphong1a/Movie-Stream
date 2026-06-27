import type { Metadata } from "next";
import Link from "next/link";
import { Heart, Bookmark, Star, History, Shield } from "lucide-react";
import { requireUser } from "@/lib/session";
import { getUserStats } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Tài khoản" };

export default async function AccountPage() {
  const user = await requireUser();
  const stats = await getUserStats(user.id);

  const cards = [
    { label: "Yêu thích", value: stats.favorites, href: "/yeu-thich", icon: Heart },
    { label: "Xem sau", value: stats.watchlist, href: "/xem-sau", icon: Bookmark },
    { label: "Đánh giá", value: stats.reviews, href: "#", icon: Star },
    { label: "Lịch sử xem", value: stats.history, href: "/lich-su", icon: History },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-center gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-6">
        <div className="flex size-16 items-center justify-center rounded-full bg-[var(--color-primary)] text-2xl font-bold text-white">
          {(user.name ?? user.email ?? "U").charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-xl font-bold">{user.name ?? "Người dùng"}</h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            {user.email}
          </p>
          {user.role === "ADMIN" && (
            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-[var(--color-primary)]/20 px-2 py-0.5 text-xs text-[var(--color-primary)]">
              <Shield className="size-3" /> Quản trị viên
            </span>
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4 text-center hover:border-[var(--color-primary)]"
          >
            <c.icon className="mx-auto mb-2 size-5 text-[var(--color-primary)]" />
            <div className="text-2xl font-bold">{c.value}</div>
            <div className="text-xs text-[var(--color-muted-foreground)]">
              {c.label}
            </div>
          </Link>
        ))}
      </div>

      {user.role === "ADMIN" && (
        <Link
          href="/admin"
          className="mt-6 flex items-center gap-2 rounded-lg border border-[var(--color-primary)] bg-[var(--color-primary)]/10 p-4 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/20"
        >
          <Shield className="size-5" /> Vào trang quản trị
        </Link>
      )}
    </div>
  );
}
