import Link from "next/link";
import { Film } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-[var(--color-border)] bg-[var(--color-card)]">
      <div className="mx-auto max-w-[1600px] px-4 py-10 md:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Film className="size-5 text-[var(--color-primary)]" />
            <span className="font-serif text-lg font-bold tracking-tight">
              MovieStream
            </span>
          </Link>
          <nav className="flex flex-wrap gap-6 text-sm text-[var(--color-muted-foreground)]">
            <Link href="/" className="transition-colors hover:text-[var(--color-foreground)]">
              Trang chủ
            </Link>
            <Link href="/duyet" className="transition-colors hover:text-[var(--color-foreground)]">
              Duyệt phim
            </Link>
            <Link href="/tim-kiem" className="transition-colors hover:text-[var(--color-foreground)]">
              Tìm kiếm
            </Link>
          </nav>
        </div>
        <p className="mt-8 text-xs text-[var(--color-muted-foreground)]">
          © {new Date().getFullYear()} MovieStream. Nội dung phim chỉ phục vụ
          mục đích học tập, demo.
        </p>
      </div>
    </footer>
  );
}
