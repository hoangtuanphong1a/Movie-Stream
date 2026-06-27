import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Heart, Bookmark, Star, History, Shield, Play } from "lucide-react";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getUserStats, getFavorites, getWatchHistory } from "@/lib/queries";
import { posterUrl } from "@/lib/images";
import { MovieCard } from "@/components/movie-card";
import { ProfileForm } from "@/components/account/profile-form";
import { PasswordForm } from "@/components/account/password-form";
import { FadeIn, Reveal } from "@/components/motion/reveal";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Tài khoản" };

export default async function AccountPage() {
  const sessionUser = await requireUser();
  const [u, stats, favorites, history] = await Promise.all([
    prisma.user.findUnique({ where: { id: sessionUser.id } }),
    getUserStats(sessionUser.id),
    getFavorites(sessionUser.id),
    getWatchHistory(sessionUser.id),
  ]);
  const name = u?.name ?? sessionUser.name ?? "Người dùng";
  const email = u?.email ?? sessionUser.email ?? "";
  const image = u?.image ?? null;
  const isAdmin = (u?.role ?? sessionUser.role) === "ADMIN";

  const cards = [
    { label: "Yêu thích", value: stats.favorites, href: "/yeu-thich", icon: Heart },
    { label: "Xem sau", value: stats.watchlist, href: "/xem-sau", icon: Bookmark },
    { label: "Đánh giá", value: stats.reviews, href: "#", icon: Star },
    { label: "Lịch sử xem", value: stats.history, href: "/lich-su", icon: History },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-8">
      {/* Header */}
      <FadeIn className="flex flex-col items-start gap-4 border-b border-[var(--color-border)] pb-8 sm:flex-row sm:items-center">
        <div className="relative size-20 overflow-hidden rounded-full border border-[var(--color-border)] bg-[var(--color-primary)]">
          {image ? (
            // Avatar là URL tuỳ ý người dùng nhập → dùng <img> thường (next/image
            // yêu cầu khai báo host, không thể whitelist mọi nguồn).
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt={name} className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center text-3xl font-bold text-white">
              {(name || email || "U").charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight">{name}</h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">{email}</p>
          {isAdmin && (
            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-[var(--color-primary)] px-2 py-0.5 text-xs text-white">
              <Shield className="size-3" /> Quản trị viên
            </span>
          )}
        </div>
        {isAdmin && (
          <Link
            href="/admin"
            className="ml-auto inline-flex items-center gap-2 rounded-md border border-[var(--color-border)] px-4 py-2 text-sm font-medium transition-colors hover:bg-[var(--color-accent)]"
          >
            <Shield className="size-4" /> Trang quản trị
          </Link>
        )}
      </FadeIn>

      {/* Thống kê */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4 text-center transition-colors hover:border-[var(--color-primary)]"
          >
            <c.icon className="mx-auto mb-2 size-5" />
            <div className="text-2xl font-bold">{c.value}</div>
            <div className="text-xs text-[var(--color-muted-foreground)]">
              {c.label}
            </div>
          </Link>
        ))}
      </div>

      {/* Hồ sơ + mật khẩu */}
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <Reveal className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-6">
          <h2 className="mb-4 font-serif text-xl font-bold tracking-tight">
            Chỉnh sửa hồ sơ
          </h2>
          <ProfileForm defaultName={u?.name ?? ""} defaultImage={u?.image ?? ""} />
        </Reveal>
        <Reveal
          delay={0.05}
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-6"
        >
          <h2 className="mb-4 font-serif text-xl font-bold tracking-tight">
            Đổi mật khẩu
          </h2>
          <PasswordForm />
        </Reveal>
      </div>

      {/* Tiếp tục xem */}
      {history.length > 0 && (
        <Reveal className="mt-10">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-serif text-xl font-bold tracking-tight">
              Tiếp tục xem
            </h2>
            <Link
              href="/lich-su"
              className="text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
            >
              Xem tất cả
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {history.slice(0, 4).map((h) => {
              const pct =
                h.durationSeconds > 0
                  ? Math.min(100, Math.round((h.progressSeconds / h.durationSeconds) * 100))
                  : 0;
              const href = `/xem/${h.movie.slug}${h.episodeId ? `?tap=${h.episodeId}` : ""}`;
              return (
                <Link
                  key={h.id}
                  href={href}
                  className="group flex gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-3 transition-colors hover:border-[var(--color-primary)]"
                >
                  <div className="relative aspect-[2/3] w-14 shrink-0 overflow-hidden rounded">
                    <Image
                      src={posterUrl(h.movie.posterPath)}
                      alt={h.movie.title}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                      <Play className="size-5 fill-white text-white" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{h.movie.title}</p>
                    {h.episode && (
                      <p className="text-xs text-[var(--color-muted-foreground)]">
                        Tập {h.episode.number}
                      </p>
                    )}
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded bg-[var(--color-muted)]">
                      <div
                        className="h-full rounded bg-[var(--color-primary)]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
                      Đã xem {pct}%
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </Reveal>
      )}

      {/* Yêu thích gần đây */}
      {favorites.length > 0 && (
        <Reveal className="mt-10">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-serif text-xl font-bold tracking-tight">
              Yêu thích gần đây
            </h2>
            <Link
              href="/yeu-thich"
              className="text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
            >
              Xem tất cả
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
            {favorites.slice(0, 6).map((f) => (
              <MovieCard key={f.id} movie={f.movie} />
            ))}
          </div>
        </Reveal>
      )}
    </div>
  );
}
