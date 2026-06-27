/**
 * Seed phim THẬT từ TMDB (poster + backdrop thật, thể loại tiếng Việt, diễn viên, trailer).
 * Chạy:  pnpm exec tsx prisma/seed-tmdb.ts
 *
 * Lưu ý: domain api.themoviedb.org bị chặn theo SNI ở nhiều mạng VN nên script gọi
 * API qua proxy (proxy.cors.sh). Ảnh (image.tmdb.org) KHÔNG bị chặn nên app vẫn
 * hiển thị poster/backdrop bình thường mà không cần proxy.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { slugify } from "../src/lib/utils";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const BASE = "https://api.themoviedb.org/3";
const API_KEY = process.env.TMDB_API_KEY;
const TOKEN = process.env.TMDB_ACCESS_TOKEN;
// Proxy để vượt chặn SNI. Đặt rỗng nếu mạng truy cập thẳng được TMDB API.
const PROXY = process.env.TMDB_PROXY ?? "https://proxy.cors.sh/";

if (!API_KEY && !TOKEN) {
  console.error("❌ Thiếu TMDB_API_KEY/TMDB_ACCESS_TOKEN trong .env");
  process.exit(1);
}

const ENRICH_LIMIT = 60; // số phim lấy thêm chi tiết (diễn viên, thời lượng, trailer)

// Nguồn video mẫu công khai còn sống (bucket gtv-videos của Google đã bị 403).
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
  const target = `${BASE}${path}?${sp.toString()}`;
  const url = PROXY + target;
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

async function mapPool<T, R>(items: T[], n: number, fn: (it: T, i: number) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let cursor = 0;
  await Promise.all(
    Array.from({ length: Math.min(n, items.length) }, async () => {
      while (cursor < items.length) {
        const i = cursor++;
        out[i] = await fn(items[i], i);
      }
    }),
  );
  return out;
}

async function collectIds(path: string, pages: number, bag: Map<number, any>) {
  for (let p = 1; p <= pages; p++) {
    try {
      const data = await tmdb(path, { page: String(p) });
      for (const r of data.results ?? []) if (r.id && !bag.has(r.id)) bag.set(r.id, r);
      await sleep(150);
    } catch (e) {
      console.warn(`  ! Bỏ qua ${path} trang ${p}: ${(e as Error).message}`);
    }
  }
}

async function main() {
  console.log(`🌱 Seed phim THẬT từ TMDB (proxy: ${PROXY || "trực tiếp"})...`);

  // ── 1. Thể loại (movie + tv) — chỉ tải dữ liệu, tạo DB sau khi reset ──
  const [mg, tg] = await Promise.all([tmdb("/genre/movie/list"), tmdb("/genre/tv/list")]);
  const tmdbGenres: { id: number; name: string }[] = [...(mg.genres ?? []), ...(tg.genres ?? [])];

  // ── 2. Gom danh sách phim (đủ dữ liệu cơ bản ngay từ list) ──
  const movieBag = new Map<number, any>();
  await collectIds("/movie/popular", 12, movieBag);
  await collectIds("/movie/top_rated", 8, movieBag);
  await collectIds("/movie/now_playing", 4, movieBag);
  await collectIds("/trending/movie/week", 2, movieBag);
  const movieList = [...movieBag.values()].slice(0, 350);
  const featuredIds = movieList.filter((m) => m.backdrop_path).slice(0, 6).map((m) => m.id as number);
  console.log(`  • ${movieList.length} phim lẻ`);

  const tvBag = new Map<number, any>();
  await collectIds("/tv/popular", 3, tvBag);
  await collectIds("/tv/top_rated", 2, tvBag);
  const tvList = [...tvBag.values()].slice(0, 40);
  console.log(`  • ${tvList.length} phim bộ`);

  // ── 3. Reset phim/thể loại/diễn viên cũ, giữ tài khoản ──
  await prisma.movie.deleteMany({}); // cascade xoá MovieGenre, nên xoá genre an toàn sau đó
  await prisma.genre.deleteMany({});
  await prisma.person.deleteMany({});
  await prisma.user.upsert({
    where: { email: "admin@moviestream.test" },
    update: {},
    create: { email: "admin@moviestream.test", name: "Quản trị viên", passwordHash: await bcrypt.hash("admin123", 10), role: "ADMIN" },
  });
  await prisma.user.upsert({
    where: { email: "user@moviestream.test" },
    update: {},
    create: { email: "user@moviestream.test", name: "Người dùng", passwordHash: await bcrypt.hash("user123", 10), role: "USER" },
  });
  console.log("  ✓ Reset xong, giữ tài khoản admin & user");

  // ── 3.5. Tạo thể loại mới (bảng đã trống nên không lo trùng) ──
  const genreMap = new Map<number, string>();
  const usedGenreSlugs = new Set<string>();
  for (const g of tmdbGenres) {
    if (genreMap.has(g.id)) continue;
    let slug = slugify(g.name) || `the-loai-${g.id}`;
    while (usedGenreSlugs.has(slug)) slug = `${slug}-${g.id}`;
    usedGenreSlugs.add(slug);
    const rec = await prisma.genre.create({ data: { name: g.name, slug, tmdbId: g.id } });
    genreMap.set(g.id, rec.id);
  }
  console.log(`  ✓ ${genreMap.size} thể loại`);

  // ── 4. Lấy chi tiết cho ~40 phim đầu (best-effort) ──
  const enrichIds = movieList.slice(0, ENRICH_LIMIT).map((m) => m.id as number);
  console.log(`  ⏳ Lấy chi tiết ${enrichIds.length} phim...`);
  const detailArr = await mapPool(enrichIds, 4, (id) =>
    tmdb(`/movie/${id}`, { append_to_response: "credits,videos" }).catch(() => null),
  );
  const detailMap = new Map<number, any>();
  enrichIds.forEach((id, i) => detailMap.set(id, detailArr[i]));
  const enriched = detailArr.filter(Boolean).length;
  console.log(`  ✓ ${enriched}/${enrichIds.length} phim có chi tiết`);

  // ── 5. Tạo phim ──
  const usedSlugs = new Set<string>();
  const personCache = new Map<number, string>();

  async function personId(c: any): Promise<string> {
    if (personCache.has(c.id)) return personCache.get(c.id)!;
    const rec = await prisma.person.upsert({
      where: { tmdbId: c.id },
      update: { name: c.name, profilePath: c.profile_path ?? null },
      create: { tmdbId: c.id, name: c.name, profilePath: c.profile_path ?? null },
    });
    personCache.set(c.id, rec.id);
    return rec.id;
  }

  function makeSlug(title: string, suffix: string | number, key: number): string {
    let slug = slugify(title) || `phim-${key}`;
    if (usedSlugs.has(slug)) slug = `${slug}-${suffix}`;
    if (usedSlugs.has(slug)) slug = `${slug}-${key}`;
    usedSlugs.add(slug);
    return slug;
  }

  function topCast(credits: any) {
    const seen = new Set<number>();
    return (credits?.cast ?? [])
      .filter((c: any) => c.id && !seen.has(c.id) && seen.add(c.id))
      .slice(0, 10);
  }

  let createdMovies = 0;
  for (let i = 0; i < movieList.length; i++) {
    const L = movieList[i];
    const D = detailMap.get(L.id);
    const title: string = D?.title || L.title || L.original_title || `Phim ${L.id}`;
    const releaseStr: string = D?.release_date || L.release_date || "";
    const slug = makeSlug(title, releaseStr.slice(0, 4) || L.id, L.id);

    const genreIds: number[] = D?.genres ? D.genres.map((g: any) => g.id) : (L.genre_ids ?? []);
    const genreConnect = genreIds.map((id) => genreMap.get(id)).filter(Boolean).map((genreId) => ({ genreId }));

    const trailer = D ? (D.videos?.results ?? []).find((v: any) => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser")) : null;
    const cast = D ? topCast(D.credits) : [];
    const poster = D?.poster_path ?? L.poster_path ?? null;
    const backdrop = D?.backdrop_path ?? L.backdrop_path ?? poster;
    const src = SOURCES[i % SOURCES.length];

    try {
      await prisma.movie.create({
        data: {
          tmdbId: L.id,
          title,
          originalTitle: D?.original_title ?? L.original_title ?? title,
          slug,
          overview: (D?.overview || L.overview) || null,
          posterPath: poster,
          backdropPath: backdrop,
          releaseDate: releaseStr ? new Date(releaseStr) : null,
          runtime: D?.runtime || null,
          voteAverage: Math.round((D?.vote_average ?? L.vote_average ?? 0) * 10) / 10,
          trailerKey: trailer?.key ?? null,
          type: "MOVIE",
          status: "PUBLISHED",
          featured: featuredIds.includes(L.id),
          genres: { create: genreConnect },
          videoSources: {
            // Có trailer → phát trailer YouTube mặc định, vẫn giữ video mẫu làm nguồn dự phòng.
            create: trailer
              ? [
                  { url: `https://www.youtube.com/embed/${trailer.key}`, type: "EMBED" as const, label: "Trailer", isDefault: true },
                  { url: src.url, type: src.type, label: "1080p", isDefault: false },
                ]
              : [{ url: src.url, type: src.type, label: "1080p", isDefault: true }],
          },
          cast: {
            create: await Promise.all(
              cast.map(async (c: any, order: number) => ({ personId: await personId(c), character: c.character ?? null, order })),
            ),
          },
        },
      });
      createdMovies++;
    } catch (e) {
      console.warn(`  ! Lỗi phim "${title}": ${(e as Error).message}`);
    }
  }
  console.log(`  ✓ ${createdMovies} phim lẻ`);

  // ── 6. Phim bộ (TV) từ list + mùa/tập mẫu ──
  let createdTv = 0;
  for (let i = 0; i < tvList.length; i++) {
    const L = tvList[i];
    const title: string = L.name || L.original_name || `Phim bộ ${L.id}`;
    const airStr: string = L.first_air_date || "";
    const slug = makeSlug(title, airStr.slice(0, 4) || L.id, L.id);
    const genreConnect = (L.genre_ids ?? []).map((id: number) => genreMap.get(id)).filter(Boolean).map((genreId: string) => ({ genreId }));
    const poster = L.poster_path ?? null;
    const backdrop = L.backdrop_path ?? poster;

    try {
      const tv = await prisma.movie.create({
        data: {
          tmdbId: L.id + 5_000_000,
          title,
          originalTitle: L.original_name ?? title,
          slug,
          overview: L.overview || null,
          posterPath: poster,
          backdropPath: backdrop,
          releaseDate: airStr ? new Date(airStr) : null,
          voteAverage: Math.round((L.vote_average ?? 0) * 10) / 10,
          type: "TV",
          status: "PUBLISHED",
          genres: { create: genreConnect },
        },
      });
      const season = await prisma.season.create({ data: { movieId: tv.id, number: 1, name: "Phần 1" } });
      for (let ep = 1; ep <= 4; ep++) {
        const s = SOURCES[(i + ep) % SOURCES.length];
        await prisma.episode.create({
          data: {
            seasonId: season.id,
            number: ep,
            title: `Tập ${ep}`,
            runtime: 42,
            videoSources: { create: { url: s.url, type: s.type, label: "720p", isDefault: true } },
          },
        });
      }
      createdTv++;
    } catch (e) {
      console.warn(`  ! Lỗi phim bộ "${title}": ${(e as Error).message}`);
    }
  }
  console.log(`  ✓ ${createdTv} phim bộ (1 phần × 4 tập)`);

  const [total, published, featured, genreCount, personCount] = await Promise.all([
    prisma.movie.count(),
    prisma.movie.count({ where: { status: "PUBLISHED" } }),
    prisma.movie.count({ where: { featured: true } }),
    prisma.genre.count(),
    prisma.person.count(),
  ]);
  console.log(`✅ Hoàn tất — ${total} phim (PUBLISHED ${published}, featured ${featured}), ${genreCount} thể loại, ${personCount} diễn viên`);
}

main()
  .catch((e) => {
    console.error("❌ Seed lỗi:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
