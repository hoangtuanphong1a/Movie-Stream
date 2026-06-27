import "server-only";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

const PUBLISHED = { status: "PUBLISHED" } as const;

export type SortOption = "newest" | "rating" | "title";

/** Dữ liệu cho trang chủ: phim nổi bật + các hàng gợi ý. (cache 120s — danh mục ít đổi) */
export const getHomeData = unstable_cache(
  _getHomeData,
  ["home-data-v1"],
  { revalidate: 120 },
);
async function _getHomeData() {
  const [featured, trending, newest, topRated, tvShows, classics] = await Promise.all([
    prisma.movie.findMany({
      where: { ...PUBLISHED, featured: true },
      include: { genres: { include: { genre: true } } },
      orderBy: { updatedAt: "desc" },
      take: 6,
    }),
    prisma.movie.findMany({
      where: PUBLISHED,
      orderBy: [{ viewCount: "desc" }, { voteAverage: "desc" }],
      take: 16,
    }),
    prisma.movie.findMany({
      where: PUBLISHED,
      orderBy: { createdAt: "desc" },
      take: 16,
    }),
    prisma.movie.findMany({
      where: { ...PUBLISHED, voteAverage: { gte: 7 } },
      orderBy: { voteAverage: "desc" },
      take: 16,
    }),
    prisma.movie.findMany({
      where: { ...PUBLISHED, type: "TV" },
      orderBy: { createdAt: "desc" },
      take: 16,
    }),
    prisma.movie.findMany({
      where: {
        ...PUBLISHED,
        genres: { some: { genre: { slug: "phim-kinh-dien" } } },
      },
      orderBy: { createdAt: "desc" },
      take: 16,
    }),
  ]);

  // Đếm số phim mỗi thể loại để ưu tiên thể loại nhiều phim lên đầu.
  const genres = await prisma.genre.findMany({
    include: { _count: { select: { movies: true } } },
  });
  const ranked = genres
    .filter((g) => g._count.movies >= 6)
    .sort((a, b) => b._count.movies - a._count.movies)
    .slice(0, 8);

  const genreRows = await Promise.all(
    ranked.map(async (g) => ({
      genre: g,
      movies: await prisma.movie.findMany({
        where: { ...PUBLISHED, genres: { some: { genreId: g.id } } },
        orderBy: { voteAverage: "desc" },
        take: 16,
      }),
    })),
  );

  return { featured, trending, newest, topRated, tvShows, classics, genreRows };
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

/** Bình luận của một phim (kèm trả lời lồng 1 cấp). */
export async function getComments(movieId: string) {
  const userSelect = { select: { id: true, name: true, image: true } } as const;
  return prisma.comment.findMany({
    where: { movieId, parentId: null },
    include: {
      user: userSelect,
      replies: { include: { user: userSelect }, orderBy: { createdAt: "asc" } },
    },
    orderBy: { createdAt: "desc" },
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

/** Duyệt phim có lọc + phân trang. (cache 120s theo từng bộ lọc) */
export const browseMovies = unstable_cache(
  _browseMovies,
  ["browse-movies-v1"],
  { revalidate: 120 },
);
async function _browseMovies(params: BrowseParams) {
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

/** Thể loại kèm số phim, sắp theo độ phổ biến (nhiều phim lên đầu). (cache 300s) */
export const getGenresWithCount = unstable_cache(
  _getGenresWithCount,
  ["genres-count-v1"],
  { revalidate: 300 },
);
async function _getGenresWithCount() {
  const genres = await prisma.genre.findMany({
    include: { _count: { select: { movies: true } } },
  });
  return genres
    .filter((g) => g._count.movies > 0)
    .sort((a, b) => b._count.movies - a._count.movies)
    .map((g) => ({ slug: g.slug, name: g.name, count: g._count.movies }));
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
