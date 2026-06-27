"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export function SearchBox({
  initial = "",
  autoNavigate = true,
  className = "",
}: {
  initial?: string;
  autoNavigate?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initial);
  const first = useRef(true);

  // Điều hướng tức thời có debounce khi gõ.
  useEffect(() => {
    if (!autoNavigate) return;
    if (first.current) {
      first.current = false;
      return;
    }
    const id = setTimeout(() => {
      const q = value.trim();
      if (q) router.push(`/tim-kiem?q=${encodeURIComponent(q)}`);
    }, 400);
    return () => clearTimeout(id);
  }, [value, autoNavigate, router]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const q = value.trim();
        if (q) router.push(`/tim-kiem?q=${encodeURIComponent(q)}`);
      }}
      className={`relative ${className}`}
      role="search"
    >
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Tìm phim..."
        aria-label="Tìm phim"
        className="h-9 w-full rounded-full border border-[var(--color-border)] bg-[var(--color-muted)] pl-9 pr-3 text-sm outline-none focus:border-[var(--color-primary)]"
      />
    </form>
  );
}
