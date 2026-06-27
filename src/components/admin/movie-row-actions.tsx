"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Pencil, Star, Eye, EyeOff, Trash2, Clapperboard } from "lucide-react";
import {
  deleteMovie,
  setMovieStatus,
  toggleFeatured,
} from "@/server/actions/admin";

const ICON_BTN =
  "flex size-8 items-center justify-center rounded-md border border-[var(--color-border)] hover:bg-[var(--color-accent)] disabled:opacity-50";

export function MovieRowActions({
  id,
  status,
  featured,
}: {
  id: string;
  status: "DRAFT" | "PUBLISHED";
  featured: boolean;
}) {
  const [pending, start] = useTransition();

  return (
    <div className="flex items-center gap-1">
      <Link href={`/admin/phim/${id}`} title="Sửa" className={ICON_BTN}>
        <Pencil className="size-4" />
      </Link>
      <Link
        href={`/admin/phim/${id}/nguon`}
        title="Nguồn phát"
        className={ICON_BTN}
      >
        <Clapperboard className="size-4" />
      </Link>
      <button
        title={featured ? "Bỏ nổi bật" : "Đặt nổi bật"}
        disabled={pending}
        onClick={() => start(() => toggleFeatured(id).then(() => {}))}
        className={ICON_BTN}
      >
        <Star
          className={`size-4 ${featured ? "fill-amber-500 text-amber-500" : ""}`}
        />
      </button>
      <button
        title={status === "PUBLISHED" ? "Chuyển về nháp" : "Xuất bản"}
        disabled={pending}
        onClick={() =>
          start(() =>
            setMovieStatus(
              id,
              status === "PUBLISHED" ? "DRAFT" : "PUBLISHED",
            ).then(() => {}),
          )
        }
        className={ICON_BTN}
      >
        {status === "PUBLISHED" ? (
          <Eye className="size-4" />
        ) : (
          <EyeOff className="size-4 text-[var(--color-muted-foreground)]" />
        )}
      </button>
      <button
        title="Xóa"
        disabled={pending}
        onClick={() => {
          if (confirm("Xóa phim này? Hành động không thể hoàn tác."))
            start(() => deleteMovie(id).then(() => {}));
        }}
        className={`${ICON_BTN} hover:bg-red-500/20 hover:text-red-400`}
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}
