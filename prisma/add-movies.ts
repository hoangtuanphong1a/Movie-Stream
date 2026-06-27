/**
 * Thêm phim mới từ TMDB (CỘNG DỒN — không xoá dữ liệu cũ, giữ nguyên ID).
 * Chạy:  pnpm exec tsx prisma/add-movies.ts      (mặc định 500 phim)
 *        ADD_COUNT=300 pnpm exec tsx prisma/add-movies.ts
 * Sau đó chạy fix-trailers.ts để bổ sung trailer cho các phim mới.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { slugify } from "../src/lib/utils";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const BASE = "https://api.themoviedb.org/3";
const API_KEY = process.env.TMDB_API_KEY;
const TOKEN = process.env.TMDB_ACCESS_TOKEN;
const PROXY = process.env.TMDB_PROXY ?? "https://proxy.cors.sh/";
const TARGET = Number(process.env.ADD_COUNT ?? 500);

const SOURCES: { url: string; type: "MP4" | "HLS" }[] = [
  { url: "https://media.w3.org/2010/05/sintel/trailer.mp4", type: "MP4" },
  { url: "https://media.w3.org/2010/05/bunny/trailer.mp4", type: "MP4" },
  { url: "https://media.w3.org/2010/05/video/movie_300.mp4", type: "MP4" },
  { url: "https://download.blender.org/peach/bigbuckbunny_movies/BigBuckBunny_320x180.mp4", type: "MP4" },
  { url: "https://www.w3schools.com/html/mov_bbb.mp4", type: "MP4" },
  { url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", type: "HLS" },
  { url: "https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_ts/master.m3u8", type: "HLS" },
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/* eslint-disable @typescript-eslint/no-explicit-any */
async function tmdb(path: string, params: Record<string, string> = {}): Promise<any> {
  const sp = new URLSearchParams({ language: "vi-VN", ...params });
  if (API_KEY) sp.set("api_key", API_KEY);
  const url = PROXY + `${BASE}${path}?${sp.toString()}`;
  let lastErr: unknown;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          origin: "https://moviestream.local",
          "x-requested-with": "XMLHttpRequest",
          ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      lastErr = e;
      await sleep(500 * attempt);
    }
  }
  throw lastErr;
}

async function main() {
  console.log(`➕ Thêm ${TARGET} phim mới từ TMDB (proxy ${PROXY})...`);

  const genres = await prisma.genre.findMany({ where: { tmdbId: { not: null } } });
  const genreMap = new Map<number, string>(genres.map((g) => [g.tmdbId as number, g.id]));

  const existing = await prisma.movie.findMany({ select: { tmdbId: true, slug: true } });
  const haveTmdb = new Set(existing.map((m) => m.tmdbId).filter(Boolean) as number[]);
  const usedSlugs = new Set(existing.map((m) => m.slug));

  // Gom phim mới từ discover (đi sâu trang để tránh trùng phim đã có).
  const bag = new Map<number, any>();
  let page = 13;
  while (bag.size < TARGET && page <= 90) {
    try {
      const data = await tmdb("/discover/movie", {
        sort_by: "popularity.desc",
        "vote_count.gte": "80",
        include_adult: "false",
        page: String(page),
      });
      const results = data.results ?? [];
      if (results.length === 0) break;
      for (const r of results) {
        if (r.id && !haveTmdb.has(r.id) && !bag.has(r.id)) bag.set(r.id, r);
      }
    } catch (e) {
      console.warn(`  ! trang ${page}: ${(e as Error).message}`);
    }
    page++;
    await sleep(120);
  }

  const list = [...bag.values()].slice(0, TARGET);
  console.log(`  • Gom được ${list.length} phim mới (đến trang ${page - 1})`);

  let created = 0;
  for (let i = 0; i < list.length; i++) {
    const L = list[i];
    const title: string = L.title || L.original_title || `Phim ${L.id}`;
    const year = (L.release_date ?? "").slice(0, 4);
    let slug = slugify(title) || `phim-${L.id}`;
    if (usedSlugs.has(slug)) slug = `${slug}-${year || L.id}`;
    if (usedSlugs.has(slug)) slug = `${slug}-${L.id}`;
    usedSlugs.add(slug);

    const genreConnect = (L.genre_ids ?? [])
      .map((id: number) => genreMap.get(id))
      .filter(Boolean)
      .map((genreId: string) => ({ genreId }));
    const poster = L.poster_path ?? null;
    const backdrop = L.backdrop_path ?? poster;
    const src = SOURCES[i % SOURCES.length];

    try {
      await prisma.movie.create({
        data: {
          tmdbId: L.id,
          title,
          originalTitle: L.original_title ?? title,
          slug,
          overview: L.overview || null,
          posterPath: poster,
          backdropPath: backdrop,
          releaseDate: L.release_date ? new Date(L.release_date) : null,
          voteAverage: Math.round((L.vote_average ?? 0) * 10) / 10,
          type: "MOVIE",
          status: "PUBLISHED",
          genres: { create: genreConnect },
          videoSources: {
            create: [{ url: src.url, type: src.type, label: "1080p", isDefault: true }],
          },
        },
      });
      created++;
    } catch (e) {
      console.warn(`  ! "${title}": ${(e as Error).message}`);
    }
    if ((i + 1) % 50 === 0) console.log(`  … ${i + 1}/${list.length} (tạo ${created})`);
  }

  const total = await prisma.movie.count();
  console.log(`✅ Thêm ${created} phim. Tổng cộng: ${total} phim.`);
  console.log(`   → Chạy: TRAILER_LIMIT=600 pnpm exec tsx prisma/fix-trailers.ts  để bổ sung trailer.`);
}

main()
  .catch((e) => {
    console.error("❌ Lỗi:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
