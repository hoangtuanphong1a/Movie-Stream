import Link from "next/link";
import { Film } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { SearchBox } from "@/components/search-box";
import { NavbarScroll } from "@/components/navbar-scroll";
import { UserMenu } from "@/components/user-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { buttonVariants } from "@/components/ui/button";

const navLink =
  "group relative text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-foreground)]";
const underline =
  "absolute -bottom-1 left-0 h-0.5 w-0 rounded-full bg-[var(--color-foreground)] transition-all duration-300 group-hover:w-full";

export async function Navbar() {
  const user = await getCurrentUser();

  return (
    <NavbarScroll>
      <Link href="/" className="group flex items-center gap-2">
        <Film className="size-6 transition-transform duration-300 group-hover:rotate-12" />
        <span className="hidden font-serif text-xl font-bold tracking-tight sm:inline">
          MovieStream
        </span>
      </Link>

      <nav className="hidden items-center gap-5 text-sm font-medium md:flex">
        <Link href="/" className={navLink}>
          Trang chủ
          <span className={underline} />
        </Link>
        <Link href="/duyet" className={navLink}>
          Duyệt phim
          <span className={underline} />
        </Link>
      </nav>

      <div className="ml-auto w-36 sm:w-56 md:w-72">
        <SearchBox />
      </div>

      <ThemeToggle />

      {user ? (
        <UserMenu name={user.name ?? user.email ?? "Tài khoản"} role={user.role} />
      ) : (
        <Link href="/dang-nhap" className={buttonVariants({ size: "sm" })}>
          Đăng nhập
        </Link>
      )}
    </NavbarScroll>
  );
}
