"use client";

import { useTransition } from "react";
import { setReviewStatus, adminDeleteReview } from "@/server/actions/admin";

export function ReviewActions({
  id,
  status,
}: {
  id: string;
  status: "VISIBLE" | "HIDDEN";
}) {
  const [pending, start] = useTransition();
  return (
    <div className="flex gap-2">
      {status === "VISIBLE" ? (
        <button
          disabled={pending}
          onClick={() => start(() => setReviewStatus(id, "HIDDEN"))}
          className="rounded-md border border-[var(--color-border)] px-2 py-1 text-xs hover:bg-[var(--color-accent)] disabled:opacity-50"
        >
          Ẩn
        </button>
      ) : (
        <button
          disabled={pending}
          onClick={() => start(() => setReviewStatus(id, "VISIBLE"))}
          className="rounded-md border border-[var(--color-border)] px-2 py-1 text-xs hover:bg-[var(--color-accent)] disabled:opacity-50"
        >
          Hiện
        </button>
      )}
      <button
        disabled={pending}
        onClick={() => {
          if (confirm("Xóa đánh giá này?")) start(() => adminDeleteReview(id));
        }}
        className="rounded-md border border-red-500/40 px-2 py-1 text-xs text-red-400 hover:bg-red-500/10 disabled:opacity-50"
      >
        Xóa
      </button>
    </div>
  );
}
