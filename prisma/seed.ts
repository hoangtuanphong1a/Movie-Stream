import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { slugify } from "../src/lib/utils";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

// Ảnh poster/backdrop mẫu (placeholder) để demo khi chưa import từ TMDB.
function poster(text: string) {
  const t = encodeURIComponent(text).replace(/%20/g, "+");
  return `https://placehold.co/500x750/141414/e50914?text=${t}`;
}
function backdrop(text: string) {
  const t = encodeURIComponent(text).replace(/%20/g, "+");
  return `https://placehold.co/1280x720/0a0a0a/e50914?text=${t}`;
}

// Nguồn video mẫu hợp pháp (Google sample + Mux/Apple HLS test).
const SAMPLE = {
  bunny: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  sintel: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
  elephants: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
  blazes: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  escapes: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
  hlsMux: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
  hlsApple: "https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_ts/master.m3u8",
};

const GENRES: { tmdbId: number; name: string }[] = [
  { tmdbId: 28, name: "Hành động" },
  { tmdbId: 12, name: "Phiêu lưu" },
  { tmdbId: 16, name: "Hoạt hình" },
  { tmdbId: 35, name: "Hài" },
  { tmdbId: 80, name: "Tội phạm" },
  { tmdbId: 18, name: "Chính kịch" },
  { tmdbId: 10751, name: "Gia đình" },  
  { tmdbId: 14, name: "Giả tưởng" },
  { tmdbId: 27, name: "Kinh dị" },
  { tmdbId: 10402, name: "Âm nhạc" },
  { tmdbId: 9648, name: "Bí ẩn" },
  { tmdbId: 10749, name: "Tình cảm" },
  { tmdbId: 878, name: "Khoa học viễn tưởng" },
  { tmdbId: 53, name: "Giật gân" },
  { tmdbId: 10752, name: "Chiến tranh" },
];

type SeedMovie = {
  title: string;
  overview: string;
  year: number;
  runtime: number;
  vote: number;
  genres: string[];
  featured?: boolean;
  type?: "MOVIE" | "TV";
  source: { url: string; type: "MP4" | "HLS"; label: string };
};

const MOVIES: SeedMovie[] = [
  {
    title: "Vũ Trụ Song Song",
    overview:
      "Một nhà vật lý phát hiện cánh cổng dẫn sang các vũ trụ song song và phải ngăn chặn thảm họa đa chiều đe dọa toàn nhân loại.",
    year: 2024, runtime: 128, vote: 8.4, featured: true,
    genres: ["Khoa học viễn tưởng", "Giật gân", "Phiêu lưu"],
    source: { url: SAMPLE.hlsMux, type: "HLS", label: "1080p" },
  },
  {
    title: "Cuộc Chiến Cuối Cùng",
    overview:
      "Trong những ngày tàn của cuộc chiến, một tiểu đội nhỏ thực hiện nhiệm vụ bất khả thi để cứu lấy hàng ngàn sinh mạng.",
    year: 2023, runtime: 142, vote: 7.9,
    genres: ["Hành động", "Chiến tranh", "Chính kịch"],
    source: { url: SAMPLE.blazes, type: "MP4", label: "720p" },
  },
  {
    title: "Tình Yêu Mùa Hạ",
    overview:
      "Hai con người xa lạ tình cờ gặp nhau trong một mùa hè đáng nhớ ở thành phố biển, và tình yêu chớm nở giữa muôn vàn ngã rẽ.",
    year: 2024, runtime: 105, vote: 7.2,
    genres: ["Tình cảm", "Chính kịch"],
    source: { url: SAMPLE.escapes, type: "MP4", label: "720p" },
  },
  {
    title: "Bóng Đêm Trỗi Dậy",
    overview:
      "Một gia đình chuyển đến ngôi nhà cổ và dần nhận ra thứ ẩn nấp trong bóng tối không hề muốn họ rời đi.",
    year: 2022, runtime: 98, vote: 6.8,
    genres: ["Kinh dị", "Bí ẩn", "Giật gân"],
    source: { url: SAMPLE.sintel, type: "MP4", label: "1080p" },
  },
  {
    title: "Hành Trình Kỳ Diệu",
    overview:
      "Cô bé và chú robot lạc loài cùng nhau băng qua những vùng đất kỳ ảo để tìm đường về nhà, học được ý nghĩa của tình bạn.",
    year: 2023, runtime: 112, vote: 8.1, featured: true,
    genres: ["Phiêu lưu", "Gia đình", "Hoạt hình"],
    source: { url: SAMPLE.elephants, type: "MP4", label: "1080p" },
  },
  {
    title: "Tiếng Cười Bất Tận",
    overview:
      "Một diễn viên hài thất bại có cơ hội đổi đời, nhưng cái giá phải trả khiến anh phải suy ngẫm về điều thực sự quan trọng.",
    year: 2024, runtime: 96, vote: 7.0,
    genres: ["Hài", "Chính kịch"],
    source: { url: SAMPLE.bunny, type: "MP4", label: "1080p" },
  },
  {
    title: "Bí Ẩn Thành Cổ",
    overview:
      "Một thám tử lần theo chuỗi vụ án bí ẩn dẫn tới kho báu bị nguyền rủa giữa lòng thành phố cổ.",
    year: 2021, runtime: 118, vote: 7.5,
    genres: ["Bí ẩn", "Tội phạm", "Phiêu lưu"],
    source: { url: SAMPLE.hlsApple, type: "HLS", label: "1080p" },
  },
  {
    title: "Giai Điệu Trái Tim",
    overview:
      "Cô gái trẻ theo đuổi giấc mơ âm nhạc, vượt qua nghịch cảnh để cất lên tiếng hát của riêng mình.",
    year: 2023, runtime: 109, vote: 7.8,
    genres: ["Âm nhạc", "Chính kịch", "Tình cảm"],
    source: { url: SAMPLE.bunny, type: "MP4", label: "720p" },
  },
];

const TV_SHOW = {
  title: "Biệt Đội Phá Án",
  overview:
    "Một đội điều tra tinh nhuệ giải quyết những vụ án hóc búa nhất thành phố, mỗi tập là một câu chuyện riêng đầy kịch tính.",
  year: 2024, vote: 8.0,
  genres: ["Tội phạm", "Bí ẩn", "Giật gân"],
  episodes: [
    { number: 1, title: "Manh mối đầu tiên", runtime: 45, url: SAMPLE.blazes },
    { number: 2, title: "Kẻ giấu mặt", runtime: 47, url: SAMPLE.escapes },
    { number: 3, title: "Sự thật phơi bày", runtime: 50, url: SAMPLE.bunny },
  ],
};

async function main() {
  console.log("🌱 Bắt đầu seed dữ liệu...");

  // 1) Tài khoản
  const adminHash = await bcrypt.hash("admin123", 10);
  const userHash = await bcrypt.hash("user123", 10);
  await prisma.user.upsert({
    where: { email: "admin@moviestream.test" },
    update: {},
    create: {
      email: "admin@moviestream.test",
      name: "Quản trị viên",
      passwordHash: adminHash,
      role: "ADMIN",
    },
  });
  await prisma.user.upsert({
    where: { email: "user@moviestream.test" },
    update: {},
    create: {
      email: "user@moviestream.test",
      name: "Người dùng",
      passwordHash: userHash,
      role: "USER",
    },
  });
  console.log("  ✓ Tài khoản admin & user");

  // 2) Thể loại
  const genreMap = new Map<string, string>();
  for (const g of GENRES) {
    const slug = slugify(g.name);
    const rec = await prisma.genre.upsert({
      where: { slug },
      update: { name: g.name, tmdbId: g.tmdbId },
      create: { name: g.name, slug, tmdbId: g.tmdbId },
    });
    genreMap.set(g.name, rec.id);
  }
  console.log(`  ✓ ${GENRES.length} thể loại`);

  // 3) Phim lẻ
  for (const m of MOVIES) {
    const slug = slugify(m.title);
    const movie = await prisma.movie.upsert({
      where: { slug },
      update: {},
      create: {
        title: m.title,
        slug,
        overview: m.overview,
        posterPath: poster(m.title),
        backdropPath: backdrop(m.title),
        releaseDate: new Date(`${m.year}-01-01`),
        runtime: m.runtime,
        voteAverage: m.vote,
        type: m.type ?? "MOVIE",
        status: "PUBLISHED",
        featured: m.featured ?? false,
        genres: {
          create: m.genres
            .map((name) => genreMap.get(name))
            .filter((id): id is string => Boolean(id))
            .map((genreId) => ({ genreId })),
        },
        videoSources: {
          create: {
            url: m.source.url,
            type: m.source.type,
            label: m.source.label,
            isDefault: true,
          },
        },
      },
    });
    void movie;
  }
  console.log(`  ✓ ${MOVIES.length} phim lẻ (kèm nguồn phát)`);

  // 4) Phim bộ + mùa + tập
  const tvSlug = slugify(TV_SHOW.title);
  const existingTv = await prisma.movie.findUnique({ where: { slug: tvSlug } });
  if (!existingTv) {
    const tv = await prisma.movie.create({
      data: {
        title: TV_SHOW.title,
        slug: tvSlug,
        overview: TV_SHOW.overview,
        posterPath: poster(TV_SHOW.title),
        backdropPath: backdrop(TV_SHOW.title),
        releaseDate: new Date(`${TV_SHOW.year}-01-01`),
        voteAverage: TV_SHOW.vote,
        type: "TV",
        status: "PUBLISHED",
        featured: false,
        genres: {
          create: TV_SHOW.genres
            .map((name) => genreMap.get(name))
            .filter((id): id is string => Boolean(id))
            .map((genreId) => ({ genreId })),
        },
      },
    });
    const season = await prisma.season.create({
      data: { movieId: tv.id, number: 1, name: "Phần 1" },
    });
    for (const ep of TV_SHOW.episodes) {
      await prisma.episode.create({
        data: {
          seasonId: season.id,
          number: ep.number,
          title: ep.title,
          runtime: ep.runtime,
          stillPath: backdrop(`${TV_SHOW.title} - Tap ${ep.number}`),
          videoSources: {
            create: { url: ep.url, type: "MP4", label: "720p", isDefault: true },
          },
        },
      });
    }
    console.log(`  ✓ 1 phim bộ + ${TV_SHOW.episodes.length} tập`);
  } else {
    console.log("  • Phim bộ đã tồn tại, bỏ qua");
  }

  console.log("✅ Seed hoàn tất!");
  console.log("   Admin: admin@moviestream.test / admin123");
  console.log("   User : user@moviestream.test / user123");
}

main()
  .catch((e) => {
    console.error("❌ Seed lỗi:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
