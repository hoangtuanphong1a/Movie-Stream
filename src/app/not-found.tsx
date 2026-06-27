import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="font-serif text-7xl font-bold text-[var(--color-primary)]">404</h1>
      <p className="text-lg text-[var(--color-muted-foreground)]">
        Không tìm thấy trang hoặc phim bạn yêu cầu.
      </p>
      <Link href="/" className={buttonVariants()}>
        Về trang chủ
      </Link>
    </div>
  );
}
