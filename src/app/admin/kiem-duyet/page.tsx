import Link from "next/link";
import { Star } from "lucide-react";
import { listReviewsAdmin } from "@/lib/admin-queries";
import { ReviewActions } from "@/components/admin/review-actions";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function ModerationPage() {
  const reviews = await listReviewsAdmin();

  return (
    <div className="max-w-4xl">
      <h1 className="mb-6 text-2xl font-bold">
        Kiểm duyệt đánh giá ({reviews.length})
      </h1>

      {reviews.length === 0 ? (
        <p className="text-[var(--color-muted-foreground)]">
          Chưa có đánh giá nào.
        </p>
      ) : (
        <ul className="space-y-3">
          {reviews.map((r) => (
            <li
              key={r.id}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">
                    {r.user.name ?? r.user.email}
                  </span>
                  <span className="flex items-center gap-1 text-yellow-400">
                    <Star className="size-3.5 fill-yellow-400" /> {r.rating}/10
                  </span>
                  <span className="text-[var(--color-muted-foreground)]">
                    về{" "}
                    <Link
                      href={`/phim/${r.movie.slug}`}
                      className="hover:text-[var(--color-primary)]"
                    >
                      {r.movie.title}
                    </Link>
                  </span>
                  {r.status === "HIDDEN" && (
                    <Badge className="border-red-500/40 text-red-400">
                      Đã ẩn
                    </Badge>
                  )}
                </div>
                <ReviewActions id={r.id} status={r.status} />
              </div>
              {r.comment && (
                <p className="mt-2 text-sm text-gray-300">{r.comment}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
