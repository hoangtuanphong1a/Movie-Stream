"use client";

import { useActionState } from "react";
import { submitReview, type ReviewState } from "@/server/actions/user";

export function ReviewForm({
  movieId,
  slug,
  initialRating,
  initialComment,
}: {
  movieId: string;
  slug: string;
  initialRating?: number;
  initialComment?: string;
}) {
  const [state, action, pending] = useActionState<ReviewState, FormData>(
    submitReview,
    undefined,
  );

  return (
    <form
      action={action}
      className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4"
    >
      <input type="hidden" name="movieId" value={movieId} />
      <input type="hidden" name="slug" value={slug} />

      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm font-medium">Điểm của bạn:</label>
        <select
          name="rating"
          defaultValue={initialRating ?? 8}
          className="h-9 rounded-md border border-[var(--color-border)] bg-[var(--color-muted)] px-3 text-sm"
        >
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n}/10
            </option>
          ))}
        </select>
      </div>

      <textarea
        name="comment"
        defaultValue={initialComment ?? ""}
        rows={3}
        placeholder="Chia sẻ cảm nhận của bạn về phim..."
        className="mt-3 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-muted)] p-3 text-sm outline-none focus:border-[var(--color-primary)]"
      />

      <div className="mt-3 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Đang gửi..." : initialRating ? "Cập nhật đánh giá" : "Gửi đánh giá"}
        </button>
        {state?.success && (
          <span className="text-sm text-green-400">Đã lưu đánh giá!</span>
        )}
        {state?.error && (
          <span className="text-sm text-red-400">{state.error}</span>
        )}
        {state?.fieldErrors?.comment && (
          <span className="text-sm text-red-400">
            {state.fieldErrors.comment[0]}
          </span>
        )}
      </div>
    </form>
  );
}
