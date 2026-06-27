"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { slugify } from "@/lib/utils";
import { tmdbMovieDetails } from "@/lib/tmdb";

export type AdminFormState =
  | {
      error?: string;
      success?: boolean;
      fieldErrors?: Record<string, string[] | undefined>;
    }
  | undefined;

async function ensureUniqueSlug(base: string, ignoreTmdbId?: number) {
  const slug = base || "phim";
  const existing = await prisma.movie.findUnique({ where: { slug } });
  if (existing && existing.tmdbId !== ignoreTmdbId) {
    return `${slug}-${ignoreTmdbId ?? Math.floor(Math.random() * 100000)}`;
  }
  return slug;
}

// ─────────── Import từ TMDB ───────────
export async function importMovieFromTmdb(tmdbId: number) {
  await requireAdmin();
  try {
    const d = await tmdbMovieDetails(tmdbId);
    const title: string = d.title || d.name || "Không tên";

    // Thể loại
    const genreIds: string[] = [];
    for (const g of d.genres ?? []) {
      const genre = await prisma.genre.upsert({
        where: { tmdbId: g.id },
        update: { name: g.name },
        create: { tmdbId: g.id, name: g.name, slug: slugify(g.name) },
      });
      genreIds.push(genre.id);
    }

    const trailer = (d.videos?.results ?? []).find(
      (v: { site: string; type: string; key: string }) =>
        v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser"),
    );

    const slug = await ensureUniqueSlug(slugify(title), tmdbId);

    const movie = await prisma.movie.upsert({
      where: { tmdbId },
      update: {
        title,
        overview: d.overview || null,
        originalTitle: d.original_title || null,
        posterPath: d.poster_path || null,
        backdropPath: d.backdrop_path || null,
        releaseDate: d.release_date ? new Date(d.release_date) : null,
        runtime: d.runtime || null,
        voteAverage: d.vote_average || 0,
        trailerKey: trailer?.key || null,
        genres: { deleteMany: {}, create: genreIds.map((genreId) => ({ genreId })) },
      },
      create: {
        tmdbId,
        title,
        slug,
        overview: d.overview || null,
        originalTitle: d.original_title || null,
        posterPath: d.poster_path || null,
        backdropPath: d.backdrop_path || null,
        releaseDate: d.release_date ? new Date(d.release_date) : null,
        runtime: d.runtime || null,
        voteAverage: d.vote_average || 0,
        trailerKey: trailer?.key || null,
        type: "MOVIE",
        status: "DRAFT",
        genres: { create: genreIds.map((genreId) => ({ genreId })) },
      },
    });

    // Diễn viên (top 10)
    await prisma.castMember.deleteMany({ where: { movieId: movie.id } });
    const cast = (d.credits?.cast ?? []).slice(0, 10);
    let order = 0;
    for (const c of cast) {
      const person = await prisma.person.upsert({
        where: { tmdbId: c.id },
        update: { name: c.name, profilePath: c.profile_path || null },
        create: { tmdbId: c.id, name: c.name, profilePath: c.profile_path || null },
      });
      await prisma.castMember.create({
        data: {
          movieId: movie.id,
          personId: person.id,
          character: c.character || null,
          order: order++,
        },
      });
    }

    revalidatePath("/admin/phim");
    return { ok: true, slug: movie.slug };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Import thất bại" };
  }
}

// ─────────── CRUD phim ───────────
const movieSchema = z.object({
  title: z.string().min(1, "Nhập tên phim"),
  overview: z.string().optional(),
  posterPath: z.string().optional(),
  backdropPath: z.string().optional(),
  releaseDate: z.string().optional(),
  runtime: z.string().optional(),
  voteAverage: z.string().optional(),
  trailerKey: z.string().optional(),
  type: z.enum(["MOVIE", "TV"]),
  status: z.enum(["DRAFT", "PUBLISHED"]),
});

export async function upsertMovie(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const parsed = movieSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }
  const data = parsed.data;
  const featured = formData.get("featured") === "on";
  const genreIds = (formData.getAll("genreIds") as string[]).filter(Boolean);

  const base = {
    title: data.title,
    overview: data.overview || null,
    posterPath: data.posterPath || null,
    backdropPath: data.backdropPath || null,
    releaseDate: data.releaseDate ? new Date(data.releaseDate) : null,
    runtime: data.runtime ? Number(data.runtime) || null : null,
    voteAverage: data.voteAverage ? Number(data.voteAverage) || 0 : 0,
    trailerKey: data.trailerKey || null,
    type: data.type,
    status: data.status,
    featured,
  };

  if (id) {
    await prisma.movie.update({
      where: { id },
      data: {
        ...base,
        genres: {
          deleteMany: {},
          create: genreIds.map((genreId) => ({ genreId })),
        },
      },
    });
  } else {
    const slugInput = String(formData.get("slug") ?? "").trim();
    const slug = await ensureUniqueSlug(slugInput || slugify(data.title));
    await prisma.movie.create({
      data: {
        ...base,
        slug,
        genres: { create: genreIds.map((genreId) => ({ genreId })) },
      },
    });
  }

  revalidatePath("/admin/phim");
  redirect("/admin/phim");
}

export async function deleteMovie(id: string) {
  await requireAdmin();
  await prisma.movie.delete({ where: { id } });
  revalidatePath("/admin/phim");
}

export async function setMovieStatus(id: string, status: "DRAFT" | "PUBLISHED") {
  await requireAdmin();
  await prisma.movie.update({ where: { id }, data: { status } });
  revalidatePath("/admin/phim");
}

export async function toggleFeatured(id: string) {
  await requireAdmin();
  const m = await prisma.movie.findUnique({ where: { id } });
  if (m) {
    await prisma.movie.update({
      where: { id },
      data: { featured: !m.featured },
    });
  }
  revalidatePath("/admin/phim");
}

// ─────────── Nguồn phát ───────────
export async function addVideoSource(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();
  const pageMovieId = String(formData.get("pageMovieId") ?? "");
  const movieId = String(formData.get("movieId") ?? "") || null;
  const episodeId = String(formData.get("episodeId") ?? "") || null;
  const url = String(formData.get("url") ?? "").trim();
  const type = String(formData.get("type") ?? "MP4") as "MP4" | "HLS" | "EMBED";
  const label = String(formData.get("label") ?? "").trim() || null;
  const isDefault = formData.get("isDefault") === "on";

  if (!url) return { error: "Nhập URL nguồn phát" };
  if (!movieId && !episodeId) return { error: "Thiếu phim hoặc tập" };

  if (isDefault) {
    await prisma.videoSource.updateMany({
      where: movieId ? { movieId } : { episodeId },
      data: { isDefault: false },
    });
  }
  await prisma.videoSource.create({
    data: { movieId, episodeId, url, type, label, isDefault },
  });

  if (pageMovieId) revalidatePath(`/admin/phim/${pageMovieId}/nguon`);
  return { success: true };
}

export async function deleteVideoSource(id: string, pageMovieId: string) {
  await requireAdmin();
  await prisma.videoSource.delete({ where: { id } });
  revalidatePath(`/admin/phim/${pageMovieId}/nguon`);
}

export async function setDefaultVideoSource(id: string, pageMovieId: string) {
  await requireAdmin();
  const s = await prisma.videoSource.findUnique({ where: { id } });
  if (!s) return;
  await prisma.videoSource.updateMany({
    where: s.movieId ? { movieId: s.movieId } : { episodeId: s.episodeId },
    data: { isDefault: false },
  });
  await prisma.videoSource.update({ where: { id }, data: { isDefault: true } });
  revalidatePath(`/admin/phim/${pageMovieId}/nguon`);
}

// ─────────── Thể loại ───────────
export async function createGenre(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Nhập tên thể loại" };
  const slug = slugify(name);
  const exists = await prisma.genre.findUnique({ where: { slug } });
  if (exists) return { error: "Thể loại đã tồn tại" };
  await prisma.genre.create({ data: { name, slug } });
  revalidatePath("/admin/the-loai");
  return { success: true };
}

export async function deleteGenre(id: string) {
  await requireAdmin();
  await prisma.genre.delete({ where: { id } });
  revalidatePath("/admin/the-loai");
}

// ─────────── Người dùng ───────────
export async function setUserRole(userId: string, role: "USER" | "ADMIN") {
  const admin = await requireAdmin();
  if (admin.id === userId) return { error: "Không thể đổi quyền chính mình" };
  await prisma.user.update({ where: { id: userId }, data: { role } });
  revalidatePath("/admin/nguoi-dung");
  return { success: true };
}

export async function toggleUserBan(userId: string) {
  const admin = await requireAdmin();
  if (admin.id === userId) return { error: "Không thể khóa chính mình" };
  const u = await prisma.user.findUnique({ where: { id: userId } });
  if (!u) return { error: "Không tìm thấy người dùng" };
  await prisma.user.update({
    where: { id: userId },
    data: { status: u.status === "BANNED" ? "ACTIVE" : "BANNED" },
  });
  revalidatePath("/admin/nguoi-dung");
  return { success: true };
}

// ─────────── Kiểm duyệt đánh giá ───────────
export async function setReviewStatus(
  reviewId: string,
  status: "VISIBLE" | "HIDDEN",
) {
  await requireAdmin();
  await prisma.review.update({ where: { id: reviewId }, data: { status } });
  revalidatePath("/admin/kiem-duyet");
}

export async function adminDeleteReview(reviewId: string) {
  await requireAdmin();
  await prisma.review.delete({ where: { id: reviewId } });
  revalidatePath("/admin/kiem-duyet");
}
