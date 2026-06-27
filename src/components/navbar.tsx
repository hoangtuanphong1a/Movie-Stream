import Link from "next/link";
import { Film, User as UserIcon, Shield, LogOut, Heart, History } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { logoutAction } from "@/server/actions/auth";
import { SearchBox } from "@/components/search-box";
import { buttonVariants } from "@/components/ui/button";

export async function Navbar() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-background)]/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-4 px-4 md:px-8">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <Film className="size-6 text-[var(--color-primary)]" />
          <span className="hidden text-lg sm:inline">MovieStream</span>
        </Link>

        <nav className="hidden items-center gap-4 text-sm md:flex">
          <Link href="/" className="text-[var(--color-muted-foreground)] hover:text-white">
            Trang chủ
          </Link>
          <Link href="/duyet" className="text-[var(--color-muted-foreground)] hover:text-white">
            Duyệt phim
          </Link>
        </nav>

        <div className="ml-auto w-40 sm:w-56 md:w-64">
          <SearchBox />
        </div>

        {user ? (
          <div className="group relative">
            <button className="flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-muted)] px-2 py-1 text-sm">
              <UserIcon className="size-4" />
              <span className="hidden max-w-24 truncate md:inline">
                {user.name ?? user.email}
              </span>
            </button>
            <div className="invisible absolute right-0 top-full z-50 w-52 translate-y-1 rounded-md border border-[var(--color-border)] bg-[var(--color-card)] p-1 opacity-0 shadow-xl transition-all group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
              <Link href="/tai-khoan" className="flex items-center gap-2 rounded px-3 py-2 text-sm hover:bg-[var(--color-accent)]">
                <UserIcon className="size-4" /> Tài khoản
              </Link>
              <Link href="/yeu-thich" className="flex items-center gap-2 rounded px-3 py-2 text-sm hover:bg-[var(--color-accent)]">
                <Heart className="size-4" /> Yêu thích
              </Link>
              <Link href="/lich-su" className="flex items-center gap-2 rounded px-3 py-2 text-sm hover:bg-[var(--color-accent)]">
                <History className="size-4" /> Lịch sử xem
              </Link>
              {user.role === "ADMIN" && (
                <Link href="/admin" className="flex items-center gap-2 rounded px-3 py-2 text-sm text-[var(--color-primary)] hover:bg-[var(--color-accent)]">
                  <Shield className="size-4" /> Quản trị
                </Link>
              )}
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm text-[var(--color-muted-foreground)] hover:bg-[var(--color-accent)]"
                >
                  <LogOut className="size-4" /> Đăng xuất
                </button>
              </form>
            </div>
          </div>
        ) : (
          <Link href="/dang-nhap" className={buttonVariants({ size: "sm" })}>
            Đăng nhập
          </Link>
        )}
      </div>
    </header>
  );
}
