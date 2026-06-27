"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MovieCard, type CardMovie } from "./movie-card";

const EASE = [0.22, 1, 0.36, 1] as const;
const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.03 } },
};
const item: Variants = {
  hidden: { opacity: 0, x: 28 },
  show: { opacity: 1, x: 0, transition: { duration: 0.4, ease: EASE } },
};

export function MovieRow({
  title,
  movies,
  href,
  priorityCount = 0,
}: {
  title: string;
  movies: CardMovie[];
  href?: string;
  priorityCount?: number;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const scroll = (dir: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };

  if (movies.length === 0) return null;

  const arrowClass =
    "flex size-9 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-foreground)] transition-all duration-200 hover:bg-[var(--color-accent)] hover:scale-110 active:scale-95 cursor-pointer";

  return (
    <section className="group/row">
      <div className="mb-4 flex items-end justify-between px-4 md:px-8">
        <h2 className="flex items-center gap-3 font-serif text-2xl font-bold tracking-tight md:text-3xl">
          <span className="h-7 w-1 rounded-full bg-[var(--color-primary)] transition-all duration-300 group-hover/row:h-9" />
          {href ? (
            <Link
              href={href}
              className="transition-colors hover:text-[var(--color-primary)]"
            >
              {title}
            </Link>
          ) : (
            title
          )}
        </h2>
        <div className="hidden gap-2 opacity-70 transition-opacity duration-200 group-hover/row:opacity-100 md:flex">
          <button aria-label="Cuộn trái" onClick={() => scroll(-1)} className={arrowClass}>
            <ChevronLeft className="size-5" />
          </button>
          <button aria-label="Cuộn phải" onClick={() => scroll(1)} className={arrowClass}>
            <ChevronRight className="size-5" />
          </button>
        </div>
      </div>

      <motion.div
        ref={scroller}
        variants={container}
        initial={reduce ? false : "hidden"}
        whileInView="show"
        viewport={{ once: true, margin: "-60px" }}
        className="no-scrollbar flex gap-4 overflow-x-auto scroll-smooth px-4 pb-2 md:px-8"
      >
        {movies.map((m, i) => (
          <motion.div
            key={m.slug}
            variants={item}
            className="w-[140px] shrink-0 sm:w-[160px] md:w-[180px]"
          >
            <MovieCard movie={m} priority={i < priorityCount} />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
