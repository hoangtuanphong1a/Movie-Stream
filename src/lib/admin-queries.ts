import "server-only";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

export async function getAdminStats() {
  const [movies, published, users, reviews, agg] = await Promise.all([
    prisma.movie.count(),
    prisma.movie.count({ where: { status: "PUBLISHED" } }),
    prisma.user.count(),
    prisma.review.count(),
    prisma.movie.aggregate({ _sum: { viewCount: true } }),
  ]);
  return {
    movies,
    published,
    users,
    reviews,
    totalViews: agg._sum.viewCount ?? 0,
  };
}

export async function getRecentMovies(n = 8) {
  return prisma.movie.findMany({
    orderBy: { createdAt: "desc" },
    take: n,
    include: { genres: { include: { genre: true } } },
  });
}

export async function listMoviesAdmin({
  q,
  page = 1,
  pageSize = 20,
}: {
  q?: string;
  page?: number;
  pageSize?: number;
}) {
  const where = q
    ? { title: { contains: q, mode: "insensitive" as const } }
    : {};
  const [items, total] = await Promise.all([
    prisma.movie.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        genres: { include: { genre: true } },
        _count: { select: { videoSources: true } },
      },
    }),
    prisma.movie.count({ where }),
  ]);
  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function getMovieForEdit(id: string) {
  return prisma.movie.findUnique({
    where: { id },
    include: {
      genres: true,
      videoSources: { orderBy: { createdAt: "asc" } },
      seasons: {
        orderBy: { number: "asc" },
        include: {
          episodes: {
            orderBy: { number: "asc" },
            include: { videoSources: { orderBy: { createdAt: "asc" } } },
          },
        },
      },
    },
  });
}

export async function listGenresAdmin() {
  return prisma.genre.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { movies: true } } },
  });
}

export async function listUsersAdmin() {
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      _count: { select: { reviews: true } },
    },
  });
}

export async function listReviewsAdmin({
  status,
  q,
  page = 1,
  pageSize = 15,
}: {
  status?: "VISIBLE" | "HIDDEN";
  q?: string;
  page?: number;
  pageSize?: number;
} = {}) {
  const where: Prisma.ReviewWhereInput = {};
  if (status) where.status = status;
  const term = q?.trim();
  if (term) {
    where.OR = [
      { comment: { contains: term, mode: "insensitive" } },
      { user: { name: { contains: term, mode: "insensitive" } } },
      { user: { email: { contains: term, mode: "insensitive" } } },
      { movie: { title: { contains: term, mode: "insensitive" } } },
    ];
  }

  const [items, total, visible, hidden] = await Promise.all([
    prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: { select: { name: true, email: true } },
        movie: { select: { title: true, slug: true } },
      },
    }),
    prisma.review.count({ where }),
    prisma.review.count({ where: { status: "VISIBLE" } }),
    prisma.review.count({ where: { status: "HIDDEN" } }),
  ]);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    counts: { total: visible + hidden, visible, hidden },
  };
}
