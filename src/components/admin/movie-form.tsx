"use client";

import { useActionState } from "react";
import { upsertMovie, type AdminFormState } from "@/server/actions/admin";
import { Input } from "@/components/ui/input";

type GenreOpt = { id: string; name: string };

export type MovieFormInitial = {
  id?: string;
  title?: string;
  slug?: string;
  overview?: string | null;
  posterPath?: string | null;
  backdropPath?: string | null;
  releaseDate?: Date | null;
  runtime?: number | null;
  voteAverage?: number;
  trailerKey?: string | null;
  type?: "MOVIE" | "TV";
  status?: "DRAFT" | "PUBLISHED";
  featured?: boolean;
  genreIds?: string[];
};

const LABEL = "mb-1 block text-sm font-medium";

export function MovieForm({
  genres,
  initial,
}: {
  genres: GenreOpt[];
  initial?: MovieFormInitial;
}) {
  const [state, action, pending] = useActionState<AdminFormState, FormData>(
    upsertMovie,
    undefined,
  );
  const dateVal = initial?.releaseDate
    ? new Date(initial.releaseDate).toISOString().slice(0, 10)
    : "";
  const selected = new Set(initial?.genreIds ?? []);

  return (
    <form action={action} className="max-w-2xl space-y-4">
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}

      {state?.error && (
        <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {state.error}
        </p>
      )}

      <div>
        <label className={LABEL}>Tên phim *</label>
        <Input name="title" defaultValue={initial?.title ?? ""} required />
        {state?.fieldErrors?.title && (
          <p className="mt-1 text-xs text-red-400">{state.fieldErrors.title[0]}</p>
        )}
      </div>

      {!initial?.id && (
        <div>
          <label className={LABEL}>Slug (để trống sẽ tự tạo)</label>
          <Input name="slug" placeholder="ten-phim" />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={LABEL}>Loại</label>
          <select
            name="type"
            defaultValue={initial?.type ?? "MOVIE"}
            className="h-10 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-muted)] px-3 text-sm"
          >
            <option value="MOVIE">Phim lẻ</option>
            <option value="TV">Phim bộ</option>
          </select>
        </div>
        <div>
          <label className={LABEL}>Trạng thái</label>
          <select
            name="status"
            defaultValue={initial?.status ?? "DRAFT"}
            className="h-10 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-muted)] px-3 text-sm"
          >
            <option value="DRAFT">Nháp</option>
            <option value="PUBLISHED">Xuất bản</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className={LABEL}>Ngày phát hành</label>
          <Input type="date" name="releaseDate" defaultValue={dateVal} />
        </div>
        <div>
          <label className={LABEL}>Thời lượng (phút)</label>
          <Input
            type="number"
            name="runtime"
            defaultValue={initial?.runtime ?? ""}
          />
        </div>
        <div>
          <label className={LABEL}>Điểm (0-10)</label>
          <Input
            type="number"
            step="0.1"
            name="voteAverage"
            defaultValue={initial?.voteAverage ?? ""}
          />
        </div>
      </div>

      <div>
        <label className={LABEL}>Poster (URL hoặc path TMDB)</label>
        <Input name="posterPath" defaultValue={initial?.posterPath ?? ""} />
      </div>
      <div>
        <label className={LABEL}>Backdrop (URL hoặc path TMDB)</label>
        <Input name="backdropPath" defaultValue={initial?.backdropPath ?? ""} />
      </div>
      <div>
        <label className={LABEL}>Trailer YouTube key</label>
        <Input name="trailerKey" defaultValue={initial?.trailerKey ?? ""} />
      </div>

      <div>
        <label className={LABEL}>Mô tả</label>
        <textarea
          name="overview"
          rows={4}
          defaultValue={initial?.overview ?? ""}
          className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-muted)] p-3 text-sm"
        />
      </div>

      <div>
        <label className={LABEL}>Thể loại</label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {genres.map((g) => (
            <label key={g.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="genreIds"
                value={g.id}
                defaultChecked={selected.has(g.id)}
              />
              {g.name}
            </label>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="featured"
          defaultChecked={initial?.featured ?? false}
        />
        Phim nổi bật (hiển thị ở hero trang chủ)
      </label>

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-[var(--color-primary)] px-6 py-2.5 font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Đang lưu..." : initial?.id ? "Cập nhật phim" : "Tạo phim"}
      </button>
    </form>
  );
}
