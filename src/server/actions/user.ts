"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { reviewSchema } from "@/lib/validations";
import bcrypt from "bcryptjs";

/** Bật/tắt phim yêu thích. */
export async function toggleFavorite(movieId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Cần đăng nhập", favorited: false };

  try {
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
  } catch {
    // Thường do trang được mở trước khi DB cập nhật (movieId không còn tồn tại).
    return { error: "Phim không còn tồn tại, hãy tải lại trang.", favorited: false };
  }
}

/** Bật/tắt danh sách xem sau. */
export async function toggleWatchlist(movieId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Cần đăng nhập", watchlisted: false };

  try {
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
  } catch {
    return { error: "Phim không còn tồn tại, hãy tải lại trang.", watchlisted: false };
  }
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

// ─────────────── Bình luận / thảo luận ───────────────
const commentSchema = z
  .string()
  .trim()
  .min(1, "Nhập nội dung bình luận")
  .max(1000, "Tối đa 1000 ký tự");

/** Gửi bình luận (hoặc trả lời nếu có parentId). */
export async function postComment(input: {
  movieId: string;
  slug: string;
  content: string;
  parentId?: string | null;
}) {
  const user = await getCurrentUser();
  if (!user) return { error: "Cần đăng nhập để bình luận." };

  const parsed = commentSchema.safeParse(input.content);
  if (!parsed.success) {
    return { error: z.flattenError(parsed.error).formErrors[0] ?? "Nội dung không hợp lệ" };
  }

  try {
    await prisma.comment.create({
      data: {
        userId: user.id,
        movieId: input.movieId,
        content: parsed.data,
        parentId: input.parentId || null,
      },
    });
    if (input.slug) revalidatePath(`/phim/${input.slug}`);
    return { success: true };
  } catch {
    return { error: "Không gửi được bình luận, hãy tải lại trang." };
  }
}

/** Xóa bình luận của chính mình (hoặc admin). */
export async function deleteComment(commentId: string, slug: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Cần đăng nhập" };

  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) return { error: "Không tìm thấy bình luận" };
  if (comment.userId !== user.id && user.role !== "ADMIN") {
    return { error: "Không có quyền xóa" };
  }

  await prisma.comment.delete({ where: { id: commentId } });
  if (slug) revalidatePath(`/phim/${slug}`);
  return { success: true };
}

// ─────────────── Hồ sơ cá nhân ───────────────
export type FormState =
  | {
      error?: string;
      success?: boolean;
      fieldErrors?: Record<string, string[] | undefined>;
    }
  | undefined;

const profileSchema = z.object({
  name: z.string().min(2, "Tên tối thiểu 2 ký tự").max(50, "Tối đa 50 ký tự"),
  // Chấp nhận URL http(s) hoặc ảnh tải lên từ máy (data URL), tối đa ~1.5MB.
  image: z
    .string()
    .max(1_500_000, "Ảnh quá lớn")
    .refine(
      (v) => v === "" || /^https?:\/\//.test(v) || v.startsWith("data:image/"),
      "Ảnh phải là URL hợp lệ hoặc tệp ảnh",
    )
    .optional(),
});

/** Cập nhật hồ sơ (tên + ảnh đại diện). */
export async function updateProfile(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Cần đăng nhập" };

  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    image: formData.get("image") ?? "",
  });
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { name: parsed.data.name, image: parsed.data.image || null },
  });
  revalidatePath("/tai-khoan");
  return { success: true };
}

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Nhập mật khẩu hiện tại"),
    newPassword: z
      .string()
      .min(6, "Mật khẩu mới tối thiểu 6 ký tự")
      .max(72, "Tối đa 72 ký tự"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Mật khẩu nhập lại không khớp",
    path: ["confirmPassword"],
  });

/** Đổi mật khẩu. */
export async function changePassword(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Cần đăng nhập" };

  const parsed = passwordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser) return { error: "Không tìm thấy tài khoản" };

  const ok = await bcrypt.compare(
    parsed.data.currentPassword,
    dbUser.passwordHash,
  );
  if (!ok) return { error: "Mật khẩu hiện tại không đúng" };

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });
  return { success: true };
}
