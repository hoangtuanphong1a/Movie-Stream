# Chương 4 — Kiến trúc & Công nghệ

## 4.1. Tổng quan kiến trúc

Hệ thống xây dựng theo mô hình **full-stack hợp nhất trên Next.js 16 (App Router)**: phần giao diện (React Server/Client Components) và phần xử lý phía máy chủ (Server Actions, Route Handlers) nằm chung trong một ứng dụng, truy cập cơ sở dữ liệu PostgreSQL qua Prisma ORM. Dữ liệu metadata phim được nạp từ **TMDB API**; video được phát từ **nguồn ngoài** (đường dẫn do Admin nhập).

```mermaid
flowchart TB
    subgraph Client[Trình duyệt người dùng]
        UI[Giao diện React<br/>Server + Client Components]
        Player[Trình phát video<br/>hls.js / HTML5 video]
    end

    subgraph Next[Ứng dụng Next.js 16]
        direction TB
        Proxy[proxy.ts<br/>bảo vệ route]
        RSC[Server Components<br/>render trang]
        SA[Server Actions<br/>ghi dữ liệu]
        RH[Route Handlers /api<br/>TMDB, auth, tiến độ xem]
        AUTH[Auth.js<br/>xác thực & phiên]
        ORM[Prisma Client]
    end

    DB[(PostgreSQL)]
    TMDB[TMDB API<br/>metadata phim]
    VID[Nguồn video ngoài<br/>MP4 / HLS / embed]

    UI -->|HTTP/RSC| RSC
    UI -->|gọi action| SA
    UI -->|fetch| RH
    Player -->|tải luồng| VID
    Proxy --> RSC
    RSC --> ORM
    SA --> ORM
    RH --> ORM
    RH -->|import| TMDB
    SA --> AUTH
    AUTH --> ORM
    ORM --> DB
```

## 4.2. Phân lớp (Layered architecture)

| Lớp | Thành phần | Trách nhiệm |
|---|---|---|
| **Trình bày (Presentation)** | React Server/Client Components, Tailwind CSS, shadcn/ui | Hiển thị giao diện, tương tác người dùng, trình phát video |
| **Ứng dụng/Nghiệp vụ (Application)** | Server Actions, Route Handlers, service trong `src/server` | Xử lý logic: xác thực, import TMDB, lưu tiến độ, kiểm duyệt, CRUD |
| **Truy cập dữ liệu (Data Access)** | Prisma Client (`src/lib/prisma.ts`) | Ánh xạ đối tượng ↔ bảng, truy vấn an toàn (tham số hóa) |
| **Dữ liệu (Database)** | PostgreSQL | Lưu trữ bền vững |
| **Tích hợp ngoài (Integration)** | TMDB API client (`src/lib/tmdb.ts`) | Lấy metadata phim |

## 4.3. Luồng xử lý chính

### 4.3.1. Đăng nhập & phân quyền
```mermaid
sequenceDiagram
    actor U as Người dùng
    participant UI as Trang đăng nhập
    participant SA as Auth.js (Credentials)
    participant DB as PostgreSQL
    U->>UI: Nhập email + mật khẩu
    UI->>SA: signIn(credentials)
    SA->>DB: Tìm user theo email
    DB-->>SA: Bản ghi user (passwordHash)
    SA->>SA: bcrypt.compare(mật khẩu, hash)
    alt Hợp lệ
        SA-->>UI: Tạo phiên (JWT) + role
        UI-->>U: Chuyển về trang trước
    else Sai
        SA-->>UI: Lỗi xác thực
        UI-->>U: "Email hoặc mật khẩu không đúng"
    end
```

### 4.3.2. Xem phim & lưu tiến độ
```mermaid
sequenceDiagram
    actor U as Thành viên
    participant P as Trang Xem
    participant RH as /api/watch-progress
    participant DB as PostgreSQL
    U->>P: Mở trang xem phim/tập
    P->>DB: Lấy nguồn phát mặc định + tiến độ trước đó
    DB-->>P: VideoSource + WatchHistory
    P->>U: Khởi tạo trình phát (tua tới vị trí cũ)
    loop Mỗi ~15s khi đang xem
        P->>RH: POST tiến độ (movieId, episodeId, giây)
        RH->>DB: upsert WatchHistory
    end
```

### 4.3.3. Import phim từ TMDB (Admin)
```mermaid
sequenceDiagram
    actor A as Admin
    participant UI as Trang Import
    participant RH as /api/tmdb
    participant T as TMDB API
    participant DB as PostgreSQL
    A->>UI: Nhập từ khóa tìm kiếm
    UI->>RH: GET /api/tmdb/search?q=...
    RH->>T: search/movie
    T-->>RH: Danh sách kết quả
    RH-->>UI: Hiển thị kết quả
    A->>UI: Chọn phim để import
    UI->>RH: POST /api/tmdb/import (tmdbId)
    RH->>T: movie/{id} (chi tiết, credits, videos)
    T-->>RH: Metadata đầy đủ
    RH->>DB: upsert Movie + Genre + Cast
    DB-->>RH: OK
    RH-->>UI: Import thành công (trạng thái nháp)
```

## 4.4. Công nghệ sử dụng & lý do chọn

| Thành phần | Công nghệ | Lý do chọn |
|---|---|---|
| Framework | **Next.js 16 (App Router)** | Full-stack trong một codebase (giảm hạ tầng); Server Components giúp tải nhanh, SEO tốt; Server Actions đơn giản hóa xử lý form. |
| Ngôn ngữ | **TypeScript** | Kiểu tĩnh, ít lỗi, dễ bảo trì — phù hợp dự án nhiều module. |
| Giao diện | **Tailwind CSS + shadcn/ui** | Dựng UI nhanh, nhất quán, dễ tùy biến theo phong cách dark/Netflix. |
| ORM | **Prisma** | Mô hình hóa dữ liệu rõ ràng, type-safe, migration tiện lợi, chống SQL Injection. |
| CSDL | **PostgreSQL** | Quan hệ mạnh, ổn định, phù hợp dữ liệu nhiều bảng và truy vấn lọc. |
| Xác thực | **Auth.js (NextAuth v5)** | Chuẩn cho Next.js, hỗ trợ Credentials + JWT, dễ mở rộng OAuth (Google). |
| Mật khẩu | **bcryptjs** | Băm mật khẩu an toàn, thuần JS (chạy tốt trên Windows). |
| Validate | **Zod** (+ react-hook-form) | Kiểm tra dữ liệu nhất quán client/server. |
| Video | **hls.js** + HTML5 video | Phát luồng HLS (.m3u8) trên trình duyệt và MP4 trực tiếp. |
| Dữ liệu phim | **TMDB API** | Kho metadata phim phong phú, miễn phí cho mục đích học tập. |
| Môi trường dev | **Docker (PostgreSQL)** | Dựng DB nhanh, không cần cài đặt thủ công. |
| Quản lý gói | **pnpm** | Cài đặt nhanh, tiết kiệm dung lượng. |

## 4.5. Bảo mật

- **Băm mật khẩu** bằng bcrypt (không lưu mật khẩu thô).
- **Phân quyền theo vai trò**: kiểm tra `role = ADMIN` ở `proxy.ts` (chặn sơ bộ) **và** kiểm tra lại trong Server Actions/Route Handlers (chặn thực sự ở tầng nghiệp vụ).
- **Chống SQL Injection**: mọi truy vấn qua Prisma (tham số hóa).
- **Validate đầu vào** bằng Zod ở cả client và server.
- **Bảo vệ phiên**: JWT ký bằng `AUTH_SECRET`, cookie HTTP-only.
- **Biến môi trường nhạy cảm** (`TMDB_API_KEY`, `DATABASE_URL`, `AUTH_SECRET`) đặt trong `.env`, không commit.

## 4.6. Mô hình triển khai (Deployment)

```mermaid
flowchart LR
    Dev[Máy phát triển<br/>pnpm dev] --> DBdev[(PostgreSQL<br/>Docker container)]
    subgraph Prod[Môi trường triển khai]
        App[Next.js<br/>Vercel / Node server] --> DBprod[(PostgreSQL<br/>managed/host)]
        App --> TMDBp[TMDB API]
    end
```

- **Phát triển**: chạy `pnpm dev`, PostgreSQL qua Docker Compose.
- **Triển khai thật (hướng phát triển)**: deploy Next.js lên Vercel hoặc máy chủ Node; PostgreSQL dùng dịch vụ quản lý (Neon/Supabase/RDS). Biến môi trường cấu hình trên nền tảng triển khai.
