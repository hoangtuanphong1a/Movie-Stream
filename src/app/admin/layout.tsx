import Link from "next/link";
import {
  LayoutDashboard,
  Film,
  Download,
  Tags,
  Users,
  MessageSquareWarning,
  Home,
} from "lucide-react";
import { requireAdmin } from "@/lib/session";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/phim", label: "Phim", icon: Film },
  { href: "/admin/import", label: "Import TMDB", icon: Download },
  { href: "/admin/the-loai", label: "Thể loại", icon: Tags },
  { href: "/admin/nguoi-dung", label: "Người dùng", icon: Users },
  { href: "/admin/kiem-duyet", label: "Kiểm duyệt", icon: MessageSquareWarning },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 border-r border-[var(--color-border)] bg-[var(--color-card)] p-4 md:flex md:flex-col">
        <Link href="/admin" className="mb-6 text-lg font-bold">
          MovieStream{" "}
          <span className="text-[var(--color-primary)]">Admin</span>
        </Link>
        <nav className="space-y-1">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-[var(--color-muted-foreground)] hover:bg-[var(--color-accent)] hover:text-white"
            >
              <n.icon className="size-4" />
              {n.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/"
          className="mt-auto flex items-center gap-2 rounded-md px-3 py-2 text-sm text-[var(--color-muted-foreground)] hover:bg-[var(--color-accent)]"
        >
          <Home className="size-4" /> Về trang chủ
        </Link>
      </aside>

      <div className="flex-1">
        <header className="flex h-14 items-center gap-4 border-b border-[var(--color-border)] px-4">
          <span className="font-semibold">Quản trị</span>
          <nav className="no-scrollbar flex gap-3 overflow-x-auto text-sm md:hidden">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="whitespace-nowrap text-[var(--color-muted-foreground)] hover:text-white"
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <span className="ml-auto text-sm text-[var(--color-muted-foreground)]">
            {user.name ?? user.email}
          </span>
        </header>
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
