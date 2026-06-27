"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart, Plus, Check } from "lucide-react";
import { toggleFavorite, toggleWatchlist } from "@/server/actions/user";
import { cn } from "@/lib/utils";

export function MovieActions({
  movieId,
  slug,
  isLoggedIn,
  initialFavorite,
  initialWatchlist,
}: {
  movieId: string;
  slug: string;
  isLoggedIn: boolean;
  initialFavorite: boolean;
  initialWatchlist: boolean;
}) {
  const router = useRouter();
  const [fav, setFav] = useState(initialFavorite);
  const [wl, setWl] = useState(initialWatchlist);
  const [pending, start] = useTransition();

  const loginRedirect = () =>
    router.push(`/dang-nhap?callbackUrl=${encodeURIComponent(`/phim/${slug}`)}`);

  const onFav = () => {
    if (!isLoggedIn) return loginRedirect();
    start(async () => {
      const r = await toggleFavorite(movieId);
      if (!r.error) setFav(r.favorited);
    });
  };

  const onWl = () => {
    if (!isLoggedIn) return loginRedirect();
    start(async () => {
      const r = await toggleWatchlist(movieId);
      if (!r.error) setWl(r.watchlisted);
    });
  };

  const base =
    "inline-flex h-12 items-center gap-2 rounded-md px-6 text-base font-medium transition-colors disabled:opacity-50";

  return (
    <>
      <button
        onClick={onFav}
        disabled={pending}
        className={cn(
          base,
          fav
            ? "bg-[var(--color-primary)] text-white"
            : "bg-[var(--color-secondary)] hover:bg-[var(--color-accent)]",
        )}
      >
        <Heart className={cn("size-5", fav && "fill-white")} />
        {fav ? "Đã thích" : "Yêu thích"}
      </button>

      <button
        onClick={onWl}
        disabled={pending}
        className={cn(
          base,
          wl
            ? "bg-[var(--color-secondary)] text-white"
            : "bg-[var(--color-secondary)] hover:bg-[var(--color-accent)]",
        )}
      >
        {wl ? <Check className="size-5" /> : <Plus className="size-5" />}
        {wl ? "Trong danh sách" : "Xem sau"}
      </button>
    </>
  );
}
