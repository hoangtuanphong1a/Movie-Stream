"use client";

import { useEffect, useState, type ReactNode } from "react";

export function NavbarScroll({ children }: { children: ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-all duration-300 ${
        scrolled
          ? "border-[var(--color-border)] bg-[var(--color-background)]/90 shadow-sm backdrop-blur-md"
          : "border-transparent bg-[var(--color-background)]/70 backdrop-blur"
      }`}
    >
      <div
        className={`mx-auto flex max-w-[1600px] items-center gap-4 px-4 transition-all duration-300 md:px-8 ${
          scrolled ? "h-14" : "h-16"
        }`}
      >
        {children}
      </div>
    </header>
  );
}
