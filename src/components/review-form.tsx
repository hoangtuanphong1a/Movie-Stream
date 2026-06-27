"use client";

import { useActionState, useState } from "react";
import { Star } from "lucide-react";
import { submitReview, type ReviewState } from "@/server/actions/user";
import { cn } from "@/lib/utils";

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
  const [rating, setRating] = useState(initialRating ?? 8);
  const [hover, setHover] = useState(0);
  const shown = hover || rating;

  return (
    <form
      action={action}
      className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5"
    >
      <input type="hidden" name="movieId" value={movieId} />
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="rating" value={rating} />

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium">Điểm của bạn</span>
        <div className="flex items-center gap-0.5" onMouseLeave={() => setHover(0)}>
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onMouseEnter={() => setHover(n)}
              onClick={() => setRating(n)}
              aria-label={`${n} trên 10`}
              className="cursor-pointer p-0.5"
            >
              <Star
                className={cn(
                  "size-5 transition-colors",
                  shown >= n
                    ? "fill-amber-400 text-amber-400"
                    : "text-[var(--color-border)]",
                )}
              />
            </button>
          ))}
        </div>
        <span className="text-sm font-bold tabular-nums">{shown}/10</span>
      </div>

      <textarea
        name="comment"
        defaultValue={initialComment ?? ""}
        rows={3}
        placeholder="Chia sẻ cảm nhận của bạn về phim..."
        className="mt-4 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)] p-3 text-sm outline-none transition-colors focus:border-[var(--color-primary)]"
      />

      <div className="mt-3 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="cursor-pointer rounded-md bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[var(--color-primary-foreground)] transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Đang gửi..." : initialRating ? "Cập nhật đánh giá" : "Gửi đánh giá"}
        </button>
        {state?.success && (
          <span className="text-sm text-green-600">Đã lưu đánh giá!</span>
        )}
        {state?.error && <span className="text-sm text-red-500">{state.error}</span>}
        {state?.fieldErrors?.comment && (
          <span className="text-sm text-red-500">
            {state.fieldErrors.comment[0]}
          </span>
        )}
      </div>
    </form>
  );
}
