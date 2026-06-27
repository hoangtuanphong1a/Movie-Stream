import "dotenv/config";
import { readFileSync } from "node:fs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { slugify } from "../src/lib/utils";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

type RawMovie = {
  title: string;
  year: string;
  runtime: string;
  genres: string[];
  director: string;
  actors: string;
  plot: string;
  posterUrl: string;
  trailerKey?: string | null;
};

// Nguồn video mẫu hợp pháp (như seed.ts).
const SOURCES: { url: string; type: "MP4" | "HLS" }[] = [
  { url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", type: "MP4" },
  { url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4", type: "MP4" },
  { url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4", type: "MP4" },
  { url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4", type: "MP4" },
  { url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4", type: "MP4" },
  { url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", type: "HLS" },
  { url: "https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_ts/master.m3u8", type: "HLS" },
];

// Ánh xạ thể loại EN -> VI.
const GENRE_MAP: Record<string, string> = {
  Action: "Hành động",
  Adventure: "Phiêu lưu",
  Animation: "Hoạt hình",
  Comedy: "Hài",
  Crime: "Tội phạm",
  Drama: "Chính kịch",
  Family: "Gia đình",
  Fantasy: "Giả tưởng",
  Horror: "Kinh dị",
  Music: "Âm nhạc",
  Musical: "Âm nhạc",
  Mystery: "Bí ẩn",
  Romance: "Tình cảm",
  "Sci-Fi": "Khoa học viễn tưởng",
  "Science Fiction": "Khoa học viễn tưởng",
  Thriller: "Giật gân",
  War: "Chiến tranh",
  History: "Lịch sử",
  Biography: "Tiểu sử",
  Documentary: "Tài liệu",
  Western: "Cao bồi",
  Sport: "Thể thao",
  "Film-Noir": "Hình sự",
};

async function main() {
  console.log("🌱 Seed phim THẬT (ảnh poster thật)...");

  const chosen: RawMovie[] = JSON.parse(
    readFileSync("prisma/real-movies.json", "utf8"),
  );
  console.log(`  • Đọc ${chosen.length} phim đã lọc poster 200`);

  // Xoá phim & người (diễn viên) cũ; giữ lại tài khoản.
  await prisma.movie.deleteMany({});
  await prisma.person.deleteMany({});
  console.log("  ✓ Đã xoá phim/diễn viên demo cũ");

  // Tài khoản mẫu (đảm bảo luôn có để đăng nhập, kể cả sau db:reset).
  await prisma.user.upsert({
    where: { email: "admin@moviestream.test" },
    update: {},
    create: {
      email: "admin@moviestream.test",
      name: "Quản trị viên",
      passwordHash: await bcrypt.hash("admin123", 10),
      role: "ADMIN",
    },
  });
  await prisma.user.upsert({
    where: { email: "user@moviestream.test" },
    update: {},
    create: {
      email: "user@moviestream.test",
      name: "Người dùng",
      passwordHash: await bcrypt.hash("user123", 10),
      role: "USER",
    },
  });
  console.log("  ✓ Tài khoản admin & user");

  // Cache thể loại
  const genreCache = new Map<string, string>();
  async function genreId(enName: string): Promise<string> {
    const vi = GENRE_MAP[enName] ?? enName;
    if (genreCache.has(vi)) return genreCache.get(vi)!;
    const slug = slugify(vi);
    const rec = await prisma.genre.upsert({
      where: { slug },
      update: { name: vi },
      create: { name: vi, slug },
    });
    genreCache.set(vi, rec.id);
    return rec.id;
  }

  // Cache diễn viên
  const personCache = new Map<string, string>();
  async function personId(name: string): Promise<string> {
    if (personCache.has(name)) return personCache.get(name)!;
    const found = await prisma.person.findFirst({ where: { name } });
    const rec = found ?? (await prisma.person.create({ data: { name } }));
    personCache.set(name, rec.id);
    return rec.id;
  }

  const usedSlugs = new Set<string>();
  let created = 0;

  for (let i = 0; i < chosen.length; i++) {
    const m = chosen[i];
    let slug = slugify(m.title);
    if (usedSlugs.has(slug)) slug = `${slug}-${m.year}`;
    if (usedSlugs.has(slug)) slug = `${slug}-${i}`;
    usedSlugs.add(slug);

    const year = parseInt(m.year, 10);
    const releaseDate =
      Number.isFinite(year) && year > 1900 ? new Date(`${year}-01-01`) : null;
    const runtime = Number(m.runtime) || null;
    const voteAverage = Math.round((6.5 + (m.title.length % 24) / 10) * 10) / 10;

    const genreIds: string[] = [];
    for (const g of m.genres ?? []) genreIds.push(await genreId(g));

    const actors = (m.actors ?? "")
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean)
      .slice(0, 6);

    const src = SOURCES[i % SOURCES.length];

    await prisma.movie.create({
      data: {
        title: m.title,
        originalTitle: m.title,
        slug,
        overview: m.plot ?? null,
        posterPath: m.posterUrl,
        backdropPath: m.posterUrl,
        releaseDate,
        runtime,
        voteAverage,
        trailerKey: m.trailerKey ?? null,
        type: "MOVIE",
        status: "PUBLISHED",
        featured: i < 4,
        genres: { create: genreIds.map((genreId) => ({ genreId })) },
        cast: {
          create: await Promise.all(
            actors.map(async (name, order) => ({
              personId: await personId(name),
              order,
            })),
          ),
        },
        videoSources: {
          create: m.trailerKey
            ? {
                url: `https://www.youtube.com/embed/${m.trailerKey}`,
                type: "EMBED",
                label: "Trailer",
                isDefault: true,
              }
            : { url: src.url, type: src.type, label: "1080p", isDefault: true },
        },
      },
    });
    created++;
  }
  console.log(`  ✓ Tạo ${created} phim lẻ (poster Amazon thật)`);

  // 1 phim bộ để demo tính năng tập
  const tvGenres = ["Crime", "Mystery", "Thriller"];
  const tvGenreIds: string[] = [];
  for (const g of tvGenres) tvGenreIds.push(await genreId(g));
  const tvPoster =
    chosen[10]?.posterUrl ??
    "https://placehold.co/500x750/141414/e50914?text=Biet+Doi+Pha+An";

  const tv = await prisma.movie.create({
    data: {
      title: "Biệt Đội Phá Án",
      originalTitle: "Biệt Đội Phá Án",
      slug: "biet-doi-pha-an",
      overview:
        "Một đội điều tra tinh nhuệ giải quyết những vụ án hóc búa nhất thành phố, mỗi tập là một câu chuyện riêng đầy kịch tính.",
      posterPath: tvPoster,
      backdropPath: tvPoster,
      releaseDate: new Date("2024-01-01"),
      voteAverage: 8.0,
      type: "TV",
      status: "PUBLISHED",
      featured: false,
      genres: { create: tvGenreIds.map((genreId) => ({ genreId })) },
    },
  });
  const season = await prisma.season.create({
    data: { movieId: tv.id, number: 1, name: "Phần 1" },
  });
  const eps = [
    { number: 1, title: "Manh mối đầu tiên", runtime: 45, url: SOURCES[3].url },
    { number: 2, title: "Kẻ giấu mặt", runtime: 47, url: SOURCES[4].url },
    { number: 3, title: "Sự thật phơi bày", runtime: 50, url: SOURCES[0].url },
  ];
  for (const ep of eps) {
    await prisma.episode.create({
      data: {
        seasonId: season.id,
        number: ep.number,
        title: ep.title,
        runtime: ep.runtime,
        videoSources: { create: { url: ep.url, type: "MP4", label: "720p", isDefault: true } },
      },
    });
  }
  console.log("  ✓ Tạo 1 phim bộ + 3 tập");

  const total = await prisma.movie.count();
  const published = await prisma.movie.count({ where: { status: "PUBLISHED" } });
  const featured = await prisma.movie.count({ where: { featured: true } });
  console.log(`✅ Hoàn tất — tổng ${total} phim (PUBLISHED ${published}, featured ${featured})`);
}

main()
  .catch((e) => {
    console.error("❌ Seed lỗi:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
