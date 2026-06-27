# MovieStream 🎬

Website xem phim trực tuyến full-stack xây dựng bằng Next.js 16, Prisma + PostgreSQL, Auth.js. Dữ liệu phim import từ **TMDB** và quản lý link xem qua trang quản trị.

> 📚 Tài liệu thiết kế chi tiết (tổng quan, phân tích yêu cầu/use case, ERD, kiến trúc, giao diện) nằm trong thư mục [`docs/`](./docs/README.md) — sơ đồ vẽ bằng Mermaid.

## ✨ Tính năng

**Người dùng**
- Trang chủ: hero phim nổi bật + các hàng phim cuộn ngang (thịnh hành, mới, theo thể loại)
- Duyệt & lọc theo thể loại / năm / loại (phim lẻ–bộ) / sắp xếp; tìm kiếm có debounce
- Trang chi tiết: thông tin, thể loại, diễn viên, trailer, danh sách tập, phim liên quan
- Xem phim: trình phát hỗ trợ **HLS (.m3u8)** và **MP4**, chọn nguồn, **lưu tiến độ & xem tiếp**
- Tài khoản: đăng ký/đăng nhập, phim yêu thích, danh sách xem sau, lịch sử xem, đánh giá & bình luận

**Quản trị viên**
- Dashboard thống kê
- Quản lý phim (CRUD), trạng thái nháp/xuất bản, phim nổi bật
- **Import phim từ TMDB** (tìm kiếm → nhập 1-click)
- Quản lý nguồn phát (link xem) cho phim/tập, thể loại, người dùng (phân quyền/khóa), kiểm duyệt đánh giá

## 🛠 Công nghệ

| | |
|---|---|
| Framework | Next.js 16 (App Router, Server Components, Server Actions, Turbopack) |
| Ngôn ngữ | TypeScript, React 19 |
| Giao diện | Tailwind CSS v4 (dark theme) |
| CSDL | PostgreSQL + Prisma ORM 7 (adapter `@prisma/adapter-pg`) |
| Xác thực | Auth.js (NextAuth v5) — Credentials + JWT, phân quyền USER/ADMIN |
| Video | hls.js + HTML5 video |
| Dữ liệu phim | TMDB API |

## 🚀 Cài đặt & chạy

### Yêu cầu
- Node.js ≥ 20, **pnpm**, **Docker** (chạy PostgreSQL)

### Các bước
```bash
# 1. Cài thư viện
pnpm install

# 2. Tạo file .env từ mẫu (đã có sẵn .env cho dev)
cp .env.example .env   # rồi điền AUTH_SECRET, TMDB_API_KEY nếu cần

# 3. Khởi động PostgreSQL (Docker) — chạy ở cổng host 5433
pnpm db:up

# 4. Tạo bảng + sinh Prisma Client
pnpm db:migrate

# 5. Nạp dữ liệu mẫu (thể loại, phim, tài khoản)
pnpm db:seed

# 6. Chạy dev
pnpm dev
```
Mở **http://localhost:3000**.

### Tài khoản mẫu (sau khi seed)
| Vai trò | Email | Mật khẩu |
|---|---|---|
| Admin | `admin@moviestream.test` | `admin123` |
| User | `user@moviestream.test` | `user123` |

### Bật import từ TMDB
1. Đăng ký miễn phí tại https://www.themoviedb.org/settings/api lấy **API Key (v3)**.
2. Điền vào `.env`: `TMDB_API_KEY="..."`.
3. Vào `/admin/import`, tìm và nhập phim. (Khi chưa có key, hệ thống vẫn chạy với dữ liệu seed; ảnh dùng placeholder.)

## 📜 Scripts

| Lệnh | Tác dụng |
|---|---|
| `pnpm dev` | Chạy server phát triển |
| `pnpm build` / `pnpm start` | Build / chạy bản production |
| `pnpm db:up` / `pnpm db:down` | Bật/tắt PostgreSQL (Docker) |
| `pnpm db:migrate` | Tạo & áp dụng migration |
| `pnpm db:seed` | Nạp dữ liệu mẫu |
| `pnpm db:studio` | Mở Prisma Studio |
| `pnpm db:reset` | Reset DB + migrate + seed lại |

## 📁 Cấu trúc thư mục (rút gọn)

```
movie-stream/
├─ docs/                      # Tài liệu thiết kế + sơ đồ Mermaid
├─ prisma/                    # schema.prisma, seed.ts, migrations
├─ src/
│  ├─ app/
│  │  ├─ (public)/            # Trang công khai + khu vực người dùng
│  │  │  ├─ page.tsx          #   Trang chủ
│  │  │  ├─ duyet, tim-kiem   #   Duyệt/lọc, tìm kiếm
│  │  │  ├─ phim/[slug]       #   Chi tiết phim
│  │  │  ├─ xem/[slug]        #   Xem phim
│  │  │  └─ tai-khoan, yeu-thich, xem-sau, lich-su
│  │  ├─ (auth)/              # Đăng nhập / đăng ký
│  │  ├─ admin/               # Trang quản trị
│  │  └─ api/                 # auth, watch-progress, admin/tmdb
│  ├─ components/             # UI dùng chung (card, row, hero, player, ...)
│  ├─ lib/                    # prisma, auth helpers, queries, tmdb, images, utils
│  ├─ server/actions/         # Server Actions (auth, user, admin)
│  └─ generated/prisma/       # Prisma Client (sinh tự động)
├─ docker-compose.yml         # PostgreSQL
└─ .env / .env.example
```

## 📝 Ghi chú
- Hệ thống **chỉ lưu đường dẫn** video/ảnh, không host file phim (vấn đề bản quyền). Demo dùng các luồng video mẫu hợp pháp.
- Cổng PostgreSQL map sang **5433** ở host để tránh đụng PostgreSQL 5432 có sẵn trên máy.

---
*MovieStream — nền tảng xem phim trực tuyến.*
