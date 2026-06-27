"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { reviewSchema } from "@/lib/validations";

/** Bật/tắt phim yêu thích. */
export async function toggleFavorite(movieId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Cần đăng nhập", favorited: false };

  const existing = await prisma.favorite.findUnique({
    where: { userId_movieId: { userId: user.id, movieId } },
  });
  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
  } else {
    await prisma.favorite.create({ data: { userId: user.id, movieId } });
  }
  revalidatePath("/yeu-thich");
  return { favorited: !existing };
}

/** Bật/tắt danh sách xem sau. */
export async function toggleWatchlist(movieId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Cần đăng nhập", watchlisted: false };

  const existing = await prisma.watchlist.findUnique({
    where: { userId_movieId: { userId: user.id, movieId } },
  });
  if (existing) {
    await prisma.watchlist.delete({ where: { id: existing.id } });
  } else {
    await prisma.watchlist.create({ data: { userId: user.id, movieId } });
  }
  revalidatePath("/xem-sau");
  return { watchlisted: !existing };
}

export type ReviewState =
  | {
      error?: string;
      success?: boolean;
      fieldErrors?: Record<string, string[] | undefined>;
    }
  | undefined;

/** Gửi/cập nhật đánh giá (mỗi người 1 đánh giá/phim). */
export async function submitReview(
  _prev: ReviewState,
  formData: FormData,
): Promise<ReviewState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Cần đăng nhập để đánh giá." };

  const movieId = String(formData.get("movieId") ?? "");
  const slug = String(formData.get("slug") ?? "");
  if (!movieId) return { error: "Thiếu thông tin phim." };

  const parsed = reviewSchema.safeParse({
    rating: formData.get("rating"),
    comment: formData.get("comment"),
  });
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  await prisma.review.upsert({
    where: { userId_movieId: { userId: user.id, movieId } },
    update: { rating: parsed.data.rating, comment: parsed.data.comment },
    create: {
      userId: user.id,
      movieId,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
    },
  });

  if (slug) revalidatePath(`/phim/${slug}`);
  return { success: true };
}

/** Xóa đánh giá của chính mình. */
export async function deleteOwnReview(reviewId: string, slug: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Cần đăng nhập" };

  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review || review.userId !== user.id) return { error: "Không hợp lệ" };

  await prisma.review.delete({ where: { id: reviewId } });
  if (slug) revalidatePath(`/phim/${slug}`);
  return { success: true };
}
