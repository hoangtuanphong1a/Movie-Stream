"use client";

import { useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MovieCard, type CardMovie } from "./movie-card";

export function MovieRow({
  title,
  movies,
  href,
}: {
  title: string;
  movies: CardMovie[];
  href?: string;
}) {
  const scroller = useRef<HTMLDivElement>(null);

  const scroll = (dir: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };

  if (movies.length === 0) return null;

  return (
    <section className="group/row relative">
      <div className="mb-3 flex items-center justify-between px-4 md:px-8">
        <h2 className="text-lg font-semibold md:text-xl">
          {href ? (
            <Link href={href} className="hover:text-[var(--color-primary)]">
              {title}
            </Link>
          ) : (
            title
          )}
        </h2>
      </div>

      <div className="relative">
        <button
          aria-label="Cuộn trái"
          onClick={() => scroll(-1)}
          className="absolute left-0 top-0 z-10 hidden h-full w-10 items-center justify-center bg-gradient-to-r from-black/80 to-transparent opacity-0 transition-opacity group-hover/row:opacity-100 md:flex"
        >
          <ChevronLeft className="size-7" />
        </button>

        <div
          ref={scroller}
          className="no-scrollbar flex gap-3 overflow-x-auto scroll-smooth px-4 md:px-8"
        >
          {movies.map((m) => (
            <MovieCard
              key={m.slug}
              movie={m}
              className="w-[140px] shrink-0 sm:w-[160px] md:w-[180px]"
            />
          ))}
        </div>

        <button
          aria-label="Cuộn phải"
          onClick={() => scroll(1)}
          className="absolute right-0 top-0 z-10 hidden h-full w-10 items-center justify-center bg-gradient-to-l from-black/80 to-transparent opacity-0 transition-opacity group-hover/row:opacity-100 md:flex"
        >
          <ChevronRight className="size-7" />
        </button>
      </div>
    </section>
  );
}
