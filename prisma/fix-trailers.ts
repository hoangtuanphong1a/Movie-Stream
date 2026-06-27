/**
 * Bổ sung trailer thật (YouTube) cho các phim chưa có, đặt trailer làm nguồn mặc định.
 * Chạy:  pnpm exec tsx prisma/fix-trailers.ts
 * Không xoá/seed lại — giữ nguyên ID phim hiện có.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const BASE = "https://api.themoviedb.org/3";
const API_KEY = process.env.TMDB_API_KEY;
const TOKEN = process.env.TMDB_ACCESS_TOKEN;
const PROXY = process.env.TMDB_PROXY ?? "https://proxy.cors.sh/";
const LIMIT = Number(process.env.TRAILER_LIMIT ?? 260); // số phim xử lý tối đa

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/* eslint-disable @typescript-eslint/no-explicit-any */
async function tmdb(path: string, params: Record<string, string> = {}): Promise<any> {
  const sp = new URLSearchParams(params);
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

async function mapPool<T>(items: T[], n: number, fn: (it: T) => Promise<void>) {
  let cursor = 0;
  await Promise.all(
    Array.from({ length: Math.min(n, items.length) }, async () => {
      while (cursor < items.length) await fn(items[cursor++]);
    }),
  );
}

function pickTrailer(results: any[]): string | null {
  const yt = (results ?? []).filter((v) => v.site === "YouTube");
  const t =
    yt.find((v) => v.type === "Trailer" && v.official) ??
    yt.find((v) => v.type === "Trailer") ??
    yt.find((v) => v.type === "Teaser") ??
    yt[0];
  return t?.key ?? null;
}

async function main() {
  const movies = await prisma.movie.findMany({
    where: { trailerKey: null, tmdbId: { not: null } },
    select: { id: true, tmdbId: true, type: true, title: true },
    orderBy: { createdAt: "asc" }, // phổ biến trước
    take: LIMIT,
  });
  console.log(`🎬 Bổ sung trailer cho tối đa ${movies.length} phim (proxy ${PROXY})...`);

  let added = 0;
  let done = 0;
  await mapPool(movies, 4, async (m) => {
    const realId = m.type === "TV" ? (m.tmdbId as number) - 5_000_000 : (m.tmdbId as number);
    const path = m.type === "TV" ? `/tv/${realId}/videos` : `/movie/${realId}/videos`;
    try {
      const data = await tmdb(path, { language: "en-US" });
      const key = pickTrailer(data.results);
      if (key) {
        const embedUrl = `https://www.youtube.com/embed/${key}`;
        const embed = await prisma.videoSource.findFirst({
          where: { movieId: m.id, type: "EMBED" },
        });
        if (embed) {
          await prisma.videoSource.update({
            where: { id: embed.id },
            data: { url: embedUrl, isDefault: true, label: "Trailer" },
          });
        } else {
          await prisma.videoSource.create({
            data: { movieId: m.id, url: embedUrl, type: "EMBED", label: "Trailer", isDefault: true },
          });
        }
        await prisma.videoSource.updateMany({
          where: { movieId: m.id, type: { not: "EMBED" } },
          data: { isDefault: false },
        });
        await prisma.movie.update({ where: { id: m.id }, data: { trailerKey: key } });
        added++;
      }
    } catch {
      // bỏ qua phim lỗi mạng
    }
    if (++done % 25 === 0) console.log(`  … ${done}/${movies.length} (đã thêm ${added})`);
  });

  const withTrailer = await prisma.movie.count({ where: { trailerKey: { not: null } } });
  console.log(`✅ Xong — thêm ${added} trailer. Tổng phim có trailer: ${withTrailer}`);
}

main()
  .catch((e) => {
    console.error("❌ Lỗi:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
