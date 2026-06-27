"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

/** Nút chuyển giao diện sáng/tối, lưu lựa chọn vào localStorage. */
export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = () => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      /* ignore */
    }
    setDark(next);
  };

  return (
    <button
      onClick={toggle}
      aria-label="Đổi giao diện sáng/tối"
      title={dark ? "Chuyển sang nền sáng" : "Chuyển sang nền tối"}
      className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-accent)]"
    >
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}
