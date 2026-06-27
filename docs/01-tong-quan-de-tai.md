# Chương 1 — Tổng quan đề tài

## 1.1. Giới thiệu đề tài

**MovieStream** là một website xem phim trực tuyến cho phép người dùng duyệt, tìm kiếm, xem phim/series và tương tác (đánh giá, bình luận, lưu danh sách yêu thích, theo dõi lịch sử xem). Hệ thống lấy dữ liệu mô tả phim (tên, mô tả, poster, thể loại, năm phát hành, điểm đánh giá...) từ kho dữ liệu mở **TMDB (The Movie Database)** và lưu vào cơ sở dữ liệu riêng; phần **đường dẫn xem phim** (video) do **quản trị viên** quản lý thủ công thông qua trang quản trị.

Sản phẩm hướng tới trải nghiệm tương tự các nền tảng phổ biến (Netflix, các trang xem phim trong nước) với giao diện tối (dark mode), các hàng phim cuộn ngang, trang chi tiết phong phú và trình phát video hỗ trợ tua/xem tiếp.

## 1.2. Lý do chọn đề tài

- **Nhu cầu thực tế lớn**: xem phim trực tuyến là một trong những hình thức giải trí phổ biến nhất; bài toán xây dựng nền tảng xem phim mang tính ứng dụng cao.
- **Bao trùm nhiều kỹ thuật cốt lõi của lập trình web hiện đại**:
  - Xác thực & phân quyền người dùng (authentication, authorization).
  - Tích hợp **API bên thứ ba** (TMDB) và đồng bộ dữ liệu vào hệ thống.
  - Xử lý **streaming video** (HLS/MP4), lưu tiến độ xem.
  - Thiết kế cơ sở dữ liệu quan hệ nhiều bảng, quan hệ phức tạp (phim – mùa – tập – nguồn phát).
  - Trang quản trị (CRUD, kiểm duyệt nội dung, thống kê).
- **Công nghệ cập nhật**: sử dụng Next.js 16 (App Router, Server Components, Server Actions) — kiến trúc full-stack hiện đại, có giá trị học thuật và thực tiễn.

## 1.3. Mục tiêu của đề tài

### 1.3.1. Mục tiêu tổng quát
Xây dựng hoàn chỉnh một website xem phim trực tuyến chạy được end-to-end, có đầy đủ chức năng cho người dùng và quản trị viên, kèm tài liệu thiết kế đầy đủ.

### 1.3.2. Mục tiêu cụ thể
- Cho phép **khách** duyệt, tìm kiếm và xem thông tin phim mà không cần đăng nhập.
- Cho phép **thành viên** xem phim, đánh giá/bình luận, lưu phim yêu thích, danh sách xem sau và theo dõi lịch sử xem (xem tiếp từ vị trí dừng).
- Cung cấp **trang quản trị** để quản lý phim (kể cả **import từ TMDB**), thể loại, nguồn phát, người dùng, kiểm duyệt đánh giá và xem thống kê.
- Đảm bảo các tiêu chí phi chức năng: hiệu năng, bảo mật, khả năng sử dụng, giao diện responsive.

## 1.4. Phạm vi đề tài

### Trong phạm vi (In-scope)
- Quản lý danh mục phim lẻ và phim bộ (mùa/tập).
- Import metadata phim từ TMDB; quản lý link xem (MP4/HLS/embed) qua admin.
- Xác thực bằng email/mật khẩu, phân quyền 2 cấp: **Người dùng** và **Quản trị viên**.
- Tìm kiếm, lọc theo thể loại/năm/loại; trang chủ gợi ý theo nhóm.
- Trình phát video web, lưu tiến độ và lịch sử xem.
- Đánh giá (rating 1–10) + bình luận; kiểm duyệt nội dung.
- Trang quản trị + dashboard thống kê cơ bản.

### Ngoài phạm vi (Out-of-scope)
- **Thanh toán / gói thuê bao (subscription)**: không triển khai cổng thanh toán; có thể nêu hướng phát triển.
- **Upload & lưu trữ video gốc / hệ thống CDN riêng**: hệ thống chỉ lưu **đường dẫn** tới nguồn video (do bản quyền), không host file phim. Demo dùng các luồng video mẫu hợp pháp.
- **Ứng dụng di động native**: chỉ làm web (responsive); app di động là hướng phát triển.
- **Đề xuất bằng học máy (recommendation AI)**: chỉ gợi ý theo thể loại/độ phổ biến đơn giản.

## 1.5. Đối tượng sử dụng

| Tác nhân | Mô tả | Quyền chính |
|---|---|---|
| **Khách (Guest)** | Người dùng chưa đăng nhập | Duyệt, tìm kiếm, xem chi tiết, xem trailer, đăng ký/đăng nhập |
| **Thành viên (Member)** | Người dùng đã đăng nhập | Toàn bộ quyền của Khách + xem phim, đánh giá/bình luận, yêu thích, watchlist, lịch sử xem, quản lý hồ sơ |
| **Quản trị viên (Admin)** | Người quản trị hệ thống | Toàn quyền quản lý nội dung, người dùng, kiểm duyệt, thống kê |

## 1.6. Ý nghĩa của đề tài

- **Về mặt thực tiễn**: tạo ra một sản phẩm web hoàn chỉnh, có thể mở rộng thành nền tảng thực tế nếu bổ sung bản quyền nội dung và thanh toán.
- **Về mặt học thuật**: thực hành trọn vẹn quy trình phát triển phần mềm — khảo sát, phân tích, thiết kế, lập trình, kiểm thử và viết tài liệu; áp dụng kiến trúc và công nghệ web hiện đại.

## 1.7. Bố cục tài liệu

- **Chương 1 – Tổng quan đề tài** (tài liệu này).
- **Chương 2 – Phân tích yêu cầu & Use case**: xác định yêu cầu chức năng, phi chức năng, tác nhân và đặc tả use case.
- **Chương 3 – Thiết kế cơ sở dữ liệu**: sơ đồ ERD và từ điển dữ liệu.
- **Chương 4 – Kiến trúc & Công nghệ**: kiến trúc tổng thể, luồng xử lý, lý do chọn công nghệ.
- **Chương 5 – Thiết kế giao diện**: sitemap và mô tả wireframe các màn hình.
