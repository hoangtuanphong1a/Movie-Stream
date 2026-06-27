"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  User as UserIcon,
  Shield,
  LogOut,
  Heart,
  History,
  ChevronDown,
} from "lucide-react";
import { logoutAction } from "@/server/actions/auth";
import { cn } from "@/lib/utils";

const itemCls =
  "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-[var(--color-accent)]";

export function UserMenu({
  name,
  role,
}: {
  name: string;
  role: "USER" | "ADMIN";
}) {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex cursor-pointer items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-1.5 text-sm transition-colors hover:bg-[var(--color-accent)]"
      >
        <UserIcon className="size-4" />
        <span className="hidden max-w-24 truncate md:inline">{name}</span>
        <ChevronDown
          className={cn("size-3.5 transition-transform duration-200", open && "rotate-180")}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={reduce ? false : { opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? undefined : { opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className="absolute right-0 top-full z-50 mt-2 w-52 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-1 shadow-xl"
          >
            <Link href="/tai-khoan" className={itemCls} onClick={() => setOpen(false)}>
              <UserIcon className="size-4" /> Tài khoản
            </Link>
            <Link href="/yeu-thich" className={itemCls} onClick={() => setOpen(false)}>
              <Heart className="size-4" /> Yêu thích
            </Link>
            <Link href="/lich-su" className={itemCls} onClick={() => setOpen(false)}>
              <History className="size-4" /> Lịch sử xem
            </Link>
            {role === "ADMIN" && (
              <Link
                href="/admin"
                className={cn(itemCls, "font-medium")}
                onClick={() => setOpen(false)}
              >
                <Shield className="size-4" /> Quản trị
              </Link>
            )}
            <div className="my-1 h-px bg-[var(--color-border)]" />
            <form action={logoutAction}>
              <button
                type="submit"
                className={cn(itemCls, "w-full text-left text-[var(--color-muted-foreground)]")}
              >
                <LogOut className="size-4" /> Đăng xuất
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
