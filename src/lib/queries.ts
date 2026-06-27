import "server-only";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

const PUBLISHED = { status: "PUBLISHED" } as const;

export type SortOption = "newest" | "rating" | "title";

/** Dữ liệu cho trang chủ: phim nổi bật + các hàng gợi ý. */
export async function getHomeData() {
  const [featured, trending, newest] = await Promise.all([
    prisma.movie.findMany({
      where: { ...PUBLISHED, featured: true },
      include: { genres: { include: { genre: true } } },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    prisma.movie.findMany({
      where: PUBLISHED,
      orderBy: [{ voteAverage: "desc" }, { viewCount: "desc" }],
      take: 14,
    }),
    prisma.movie.findMany({
      where: PUBLISHED,
      orderBy: { createdAt: "desc" },
      take: 14,
    }),
  ]);

  const genres = await prisma.genre.findMany({ orderBy: { name: "asc" } });
  const genreRows: { genre: (typeof genres)[number]; movies: typeof newest }[] = [];
  for (const g of genres) {
    const movies = await prisma.movie.findMany({
      where: { ...PUBLISHED, genres: { some: { genreId: g.id } } },
      orderBy: { voteAverage: "desc" },
      take: 14,
    });
    if (movies.length >= 3) genreRows.push({ genre: g, movies });
    if (genreRows.length >= 6) break;
  }

  return { featured, trending, newest, genreRows };
}

/** Chi tiết phim theo slug (chỉ phim đã xuất bản). */
export async function getMovieBySlug(slug: string) {
  return prisma.movie.findFirst({
    where: { slug, ...PUBLISHED },
    include: {
      genres: { include: { genre: true } },
      cast: { include: { person: true }, orderBy: { order: "asc" }, take: 12 },
      seasons: {
        orderBy: { number: "asc" },
        include: {
          episodes: {
            orderBy: { number: "asc" },
            include: { videoSources: true },
          },
        },
      },
      videoSources: true,
      reviews: {
        where: { status: "VISIBLE" },
        include: { user: { select: { id: true, name: true, image: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

/** Phim liên quan theo thể loại. */
export async function getRelatedMovies(movieId: string, genreIds: string[]) {
  if (genreIds.length === 0) return [];
  return prisma.movie.findMany({
    where: {
      ...PUBLISHED,
      id: { not: movieId },
      genres: { some: { genreId: { in: genreIds } } },
    },
    orderBy: { voteAverage: "desc" },
    take: 12,
  });
}

export type BrowseParams = {
  genre?: string;
  year?: number;
  type?: "MOVIE" | "TV";
  sort?: SortOption;
  page?: number;
  pageSize?: number;
};

/** Duyệt phim có lọc + phân trang. */
export async function browseMovies(params: BrowseParams) {
  const { genre, year, type, sort = "newest", page = 1, pageSize = 24 } = params;

  const where: Prisma.MovieWhereInput = { ...PUBLISHED };
  if (genre) where.genres = { some: { genre: { slug: genre } } };
  if (type) where.type = type;
  if (year) {
    where.releaseDate = {
      gte: new Date(`${year}-01-01`),
      lt: new Date(`${year + 1}-01-01`),
    };
  }

  const orderBy: Prisma.MovieOrderByWithRelationInput =
    sort === "rating"
      ? { voteAverage: "desc" }
      : sort === "title"
        ? { title: "asc" }
        : { createdAt: "desc" };

  const [items, total] = await Promise.all([
    prisma.movie.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.movie.count({ where }),
  ]);

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

/** Tìm kiếm phim theo từ khóa. */
export async function searchMovies(q: string) {
  const term = q.trim();
  if (!term) return [];
  return prisma.movie.findMany({
    where: {
      ...PUBLISHED,
      OR: [
        { title: { contains: term, mode: "insensitive" } },
        { originalTitle: { contains: term, mode: "insensitive" } },
      ],
    },
    orderBy: { voteAverage: "desc" },
    take: 40,
  });
}

/** Tất cả thể loại. */
export async function getAllGenres() {
  return prisma.genre.findMany({ orderBy: { name: "asc" } });
}

/** Danh sách phim yêu thích của user. */
export async function getFavorites(userId: string) {
  return prisma.favorite.findMany({
    where: { userId },
    include: { movie: true },
    orderBy: { createdAt: "desc" },
  });
}

/** Danh sách xem sau của user. */
export async function getWatchlist(userId: string) {
  return prisma.watchlist.findMany({
    where: { userId },
    include: { movie: true },
    orderBy: { createdAt: "desc" },
  });
}

/** Lịch sử xem của user. */
export async function getWatchHistory(userId: string) {
  return prisma.watchHistory.findMany({
    where: { userId },
    include: { movie: true, episode: true },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });
}

/** Số liệu tổng quan của user (cho trang tài khoản). */
export async function getUserStats(userId: string) {
  const [favorites, watchlist, reviews, history] = await Promise.all([
    prisma.favorite.count({ where: { userId } }),
    prisma.watchlist.count({ where: { userId } }),
    prisma.review.count({ where: { userId } }),
    prisma.watchHistory.count({ where: { userId } }),
  ]);
  return { favorites, watchlist, reviews, history };
}

/** Trạng thái yêu thích / watchlist của user với một phim. */
export async function getUserMovieFlags(userId: string, movieId: string) {
  const [favorite, watchlist] = await Promise.all([
    prisma.favorite.findUnique({
      where: { userId_movieId: { userId, movieId } },
    }),
    prisma.watchlist.findUnique({
      where: { userId_movieId: { userId, movieId } },
    }),
  ]);
  return { isFavorite: Boolean(favorite), isWatchlist: Boolean(watchlist) };
}
