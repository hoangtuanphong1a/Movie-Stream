import Link from "next/link";
import { Film } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-12 border-t border-[var(--color-border)] bg-[var(--color-card)]">
      <div className="mx-auto max-w-[1600px] px-4 py-8 md:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <Film className="size-5 text-[var(--color-primary)]" />
            MovieStream
          </Link>
          <nav className="flex flex-wrap gap-4 text-sm text-[var(--color-muted-foreground)]">
            <Link href="/" className="hover:text-white">Trang chủ</Link>
            <Link href="/duyet" className="hover:text-white">Duyệt phim</Link>
            <Link href="/tim-kiem" className="hover:text-white">Tìm kiếm</Link>
          </nav>
        </div>
        <p className="mt-6 text-xs text-[var(--color-muted-foreground)]">
          © {new Date().getFullYear()} MovieStream — Đồ án tốt nghiệp. Nội dung
          phim chỉ phục vụ mục đích học tập, demo.
        </p>
      </div>
    </footer>
  );
}
