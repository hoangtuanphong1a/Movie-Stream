# Tài liệu thiết kế — Website Xem Phim Trực Tuyến (MovieStream)

> Bộ tài liệu thiết kế dự án. Tất cả sơ đồ được vẽ bằng **Mermaid** (GitHub và VS Code — cài extension *Markdown Preview Mermaid Support* — đều render trực tiếp).

## Thông tin chung

| Mục | Nội dung |
|---|---|
| Tên đề tài | Xây dựng website xem phim trực tuyến (MovieStream) |
| Loại sản phẩm | Ứng dụng web full-stack |
| Công nghệ chính | Next.js 16 (App Router) · TypeScript · Prisma · PostgreSQL · Tailwind CSS · Auth.js |
| Nguồn dữ liệu phim | Import metadata từ **TMDB API** → lưu DB; link xem do **Admin** quản lý |
| Ngôn ngữ giao diện | Tiếng Việt |

## Mục lục tài liệu

1. [Tổng quan đề tài](./01-tong-quan-de-tai.md) — giới thiệu, lý do, mục tiêu, phạm vi, đối tượng sử dụng.
2. [Phân tích yêu cầu & Use case](./02-phan-tich-yeu-cau.md) — yêu cầu chức năng/phi chức năng, tác nhân, sơ đồ & đặc tả use case.
3. [Thiết kế cơ sở dữ liệu](./03-thiet-ke-co-so-du-lieu.md) — sơ đồ ERD (Mermaid) + từ điển dữ liệu.
4. [Kiến trúc & Công nghệ](./04-kien-truc-cong-nghe.md) — sơ đồ kiến trúc, luồng xử lý, lý do chọn công nghệ.
5. [Thiết kế giao diện](./05-thiet-ke-giao-dien.md) — sitemap, mô tả wireframe các màn hình.

## Tài liệu kỹ thuật bổ trợ

- [Ghi chú Next.js 16](./dev/nextjs16-notes.md) — các điểm khác biệt của Next.js 16 cho lập trình viên.

## Quy ước

- **MovieStream**: tên sản phẩm trong tài liệu.
- **TMDB**: The Movie Database (themoviedb.org) — nguồn metadata phim.
- **Actor / Tác nhân**: vai trò người dùng tương tác với hệ thống (Khách, Thành viên, Quản trị viên).
- Mã use case: `UC-xx`; mã yêu cầu chức năng: `FR-xx`; yêu cầu phi chức năng: `NFR-xx`.
