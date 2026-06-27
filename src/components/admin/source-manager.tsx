"use client";

import { useActionState, useTransition } from "react";
import {
  addVideoSource,
  deleteVideoSource,
  setDefaultVideoSource,
  type AdminFormState,
} from "@/server/actions/admin";

export function AddSourceForm({
  pageMovieId,
  movieId,
  episodeId,
}: {
  pageMovieId: string;
  movieId?: string;
  episodeId?: string;
}) {
  const [state, action, pending] = useActionState<AdminFormState, FormData>(
    addVideoSource,
    undefined,
  );

  return (
    <form
      action={action}
      className="flex flex-wrap items-end gap-2 rounded-md border border-dashed border-[var(--color-border)] p-3"
    >
      <input type="hidden" name="pageMovieId" value={pageMovieId} />
      {movieId && <input type="hidden" name="movieId" value={movieId} />}
      {episodeId && <input type="hidden" name="episodeId" value={episodeId} />}

      <div className="flex-1">
        <input
          name="url"
          placeholder="URL video (.mp4 / .m3u8 / embed)"
          className="h-9 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-muted)] px-3 text-sm"
        />
      </div>
      <select
        name="type"
        defaultValue="MP4"
        className="h-9 rounded-md border border-[var(--color-border)] bg-[var(--color-muted)] px-2 text-sm"
      >
        <option value="MP4">MP4</option>
        <option value="HLS">HLS</option>
        <option value="EMBED">EMBED</option>
      </select>
      <input
        name="label"
        placeholder="1080p"
        className="h-9 w-20 rounded-md border border-[var(--color-border)] bg-[var(--color-muted)] px-2 text-sm"
      />
      <label className="flex items-center gap-1 text-xs">
        <input type="checkbox" name="isDefault" /> Mặc định
      </label>
      <button
        type="submit"
        disabled={pending}
        className="h-9 rounded-md bg-[var(--color-primary)] px-4 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "..." : "Thêm"}
      </button>
      {state?.error && (
        <span className="w-full text-xs text-red-400">{state.error}</span>
      )}
    </form>
  );
}

export function SourceActions({
  id,
  pageMovieId,
  isDefault,
}: {
  id: string;
  pageMovieId: string;
  isDefault: boolean;
}) {
  const [pending, start] = useTransition();
  return (
    <div className="flex gap-2">
      {!isDefault && (
        <button
          disabled={pending}
          onClick={() => start(() => setDefaultVideoSource(id, pageMovieId))}
          className="text-xs text-[var(--color-primary)] hover:underline disabled:opacity-50"
        >
          Đặt mặc định
        </button>
      )}
      <button
        disabled={pending}
        onClick={() => {
          if (confirm("Xóa nguồn phát này?"))
            start(() => deleteVideoSource(id, pageMovieId));
        }}
        className="text-xs text-red-400 hover:underline disabled:opacity-50"
      >
        Xóa
      </button>
    </div>
  );
}
