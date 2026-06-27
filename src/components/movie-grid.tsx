"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import { MovieCard, type CardMovie } from "./movie-card";

const EASE = [0.22, 1, 0.36, 1] as const;
const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } },
};

export function MovieGrid({ movies }: { movies: CardMovie[] }) {
  const reduce = useReducedMotion();

  if (movies.length === 0) {
    return (
      <p className="px-4 py-16 text-center text-[var(--color-muted-foreground)]">
        Không tìm thấy phim nào.
      </p>
    );
  }

  return (
    <motion.div
      variants={container}
      initial={reduce ? false : "hidden"}
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      className="grid grid-cols-3 gap-3 px-4 sm:grid-cols-4 md:grid-cols-5 md:px-8 lg:grid-cols-6 xl:grid-cols-7"
    >
      {movies.map((m, i) => (
        <motion.div key={m.slug} variants={item}>
          <MovieCard movie={m} priority={i < 6} />
        </motion.div>
      ))}
    </motion.div>
  );
}
