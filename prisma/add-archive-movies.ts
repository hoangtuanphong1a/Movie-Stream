/**
 * Thêm phim PUBLIC-DOMAIN (hết bản quyền) từ Internet Archive — XEM FULL hợp pháp.
 * Chạy:  pnpm exec tsx prisma/add-archive-movies.ts      (mặc định 30 phim)
 *        ARCHIVE_COUNT=40 pnpm exec tsx prisma/add-archive-movies.ts
 * Cộng dồn — không xoá dữ liệu cũ. Gắn vào thể loại "Phim Kinh Điển".
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { slugify } from "../src/lib/utils";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const TARGET = Number(process.env.ARCHIVE_COUNT ?? 30);
// Lọc bỏ tiêu đề nhạy cảm.
const BAD =
  /sex|nud(e|ist)|xxx|porn|erotic|orgy|naked|madness|dr\.?\s*sex|smut|molest|nazi|concentration camp|hitler|propaganda|bee girls/i;

/* eslint-disable @typescript-eslint/no-explicit-any */
async function getJson(url: string): Promise<any> {
  const res = await fetch(url, { headers: { "user-agent": "Mozilla/5.0" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function pickMp4(files: any[], id: string): string | null {
  // CHỈ lấy bản H.264 — trình duyệt phát được. Bản "512Kb MPEG4" (Xvid) KHÔNG decode được.
  const h264 = (files ?? []).filter(
    (f) =>
      /\.mp4$/i.test(f.name ?? "") &&
      String(f.format ?? "").toLowerCase().includes("h.264") &&
      Number(f.size) > 5 * 1024 * 1024 &&
      Number(f.size) < 2200 * 1024 * 1024,
  );
  if (h264.length === 0) return null;
  h264.sort((a, b) => Number(a.size) - Number(b.size)); // nhẹ nhất trong các bản H.264
  return `https://archive.org/download/${id}/${encodeURIComponent(h264[0].name)}`;
}

async function main() {
  console.log("🎞️  Thêm phim public-domain từ Internet Archive...");

  const genre = await prisma.genre.upsert({
    where: { slug: "phim-kinh-dien" },
    update: { name: "Phim Kinh Điển" },
    create: { name: "Phim Kinh Điển", slug: "phim-kinh-dien" },
  });

  const q = "collection:(feature_films) AND mediatype:(movies)";
  const searchUrl =
    "https://archive.org/advancedsearch.php?q=" +
    encodeURIComponent(q) +
    "&fl[]=identifier&fl[]=title&fl[]=year&fl[]=description&rows=250&output=json&sort[]=downloads+desc";
  const data = await getJson(searchUrl);
  const docs: any[] = data.response?.docs ?? [];
  console.log(`  • Quét ${docs.length} phim phổ biến nhất`);

  const existingMovies = await prisma.movie.findMany({ select: { slug: true, title: true } });
  const existingSlugs = new Set(existingMovies.map((m) => m.slug));
  const existingTitles = new Set(existingMovies.map((m) => m.title.toLowerCase()));

  let created = 0;
  for (const d of docs) {
    if (created >= TARGET) break;
    const title = String(d.title ?? "").trim();
    if (!title || BAD.test(title)) continue;
    if (existingTitles.has(title.toLowerCase())) continue; // tránh trùng phim

    let slug = slugify(title);
    if (!slug) continue;
    if (existingSlugs.has(slug)) slug = `${slug}-${d.year ?? "pd"}`;
    if (existingSlugs.has(slug)) continue;
    existingTitles.add(title.toLowerCase());

    let meta: any;
    try {
      meta = await getJson(`https://archive.org/metadata/${d.identifier}`);
    } catch {
      continue;
    }
    const url = pickMp4(meta.files ?? [], d.identifier);
    if (!url) continue;

    const year = parseInt(String(d.year ?? "").slice(0, 4), 10);
    const releaseDate =
      Number.isFinite(year) && year > 1800 ? new Date(`${year}-01-01`) : null;
    let overview: string | null = Array.isArray(d.description)
      ? d.description[0]
      : d.description;
    overview =
      String(overview ?? "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 600) || null;
    const poster = `https://archive.org/services/img/${d.identifier}`;

    existingSlugs.add(slug);
    try {
      await prisma.movie.create({
        data: {
          title,
          originalTitle: title,
          slug,
          overview,
          posterPath: poster,
          backdropPath: poster,
          releaseDate,
          voteAverage: 7,
          type: "MOVIE",
          status: "PUBLISHED",
          genres: { create: [{ genreId: genre.id }] },
          videoSources: { create: [{ url, type: "MP4", label: "Full", isDefault: true }] },
        },
      });
      created++;
      console.log(`  ✓ ${title} (${Number.isFinite(year) ? year : "?"})`);
    } catch (e) {
      console.warn(`  ! ${title}: ${(e as Error).message}`);
    }
  }

  console.log(`✅ Thêm ${created} phim kinh điển (XEM FULL hợp pháp).`);
}

main()
  .catch((e) => {
    console.error("❌ Lỗi:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
