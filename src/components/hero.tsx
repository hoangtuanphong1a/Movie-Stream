"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { Play, Info, Star } from "lucide-react";
import { posterUrl } from "@/lib/images";
import { buttonVariants } from "@/components/ui/button";
import { getYear } from "@/lib/utils";

type HeroMovie = {
  slug: string;
  title: string;
  overview: string | null;
  posterPath: string | null;
  backdropPath: string | null;
  voteAverage: number;
  releaseDate: Date | null;
  genres: { genre: { name: string } }[];
};

const EASE = [0.22, 1, 0.36, 1] as const;

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};

export function Hero({ movie }: { movie: HeroMovie }) {
  const reduce = useReducedMotion();
  const init = reduce ? false : "hidden";

  return (
    <section className="border-b border-[var(--color-border)]">
      <motion.div
        variants={container}
        initial={init}
        animate="show"
        className="mx-auto grid max-w-[1400px] items-center gap-10 px-4 py-12 md:grid-cols-2 md:gap-16 md:px-8 md:py-20"
      >
        {/* Cột chữ */}
        <div>
          <motion.span
            variants={item}
            className="inline-block text-xs font-semibold uppercase tracking-[0.25em] text-[var(--color-primary)]"
          >
            Phim nổi bật
          </motion.span>
          <motion.h1
            variants={item}
            className="mt-4 font-serif text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl"
          >
            {movie.title}
          </motion.h1>
          <motion.div
            variants={item}
            className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[var(--color-muted-foreground)]"
          >
            <span className="inline-flex items-center gap-1 font-medium text-[var(--color-foreground)]">
              <Star className="size-4 fill-[var(--color-primary)] text-[var(--color-primary)]" />
              {movie.voteAverage.toFixed(1)}
            </span>
            <span>{getYear(movie.releaseDate)}</span>
            <span className="h-1 w-1 rounded-full bg-[var(--color-border)]" />
            <span>{movie.genres.map((g) => g.genre.name).join(" · ")}</span>
          </motion.div>
          <motion.p
            variants={item}
            className="mt-5 max-w-prose text-base leading-relaxed text-[var(--color-muted-foreground)] line-clamp-3"
          >
            {movie.overview}
          </motion.p>
          <motion.div variants={item} className="mt-8 flex flex-wrap gap-3">
            <Link
              href={`/xem/${movie.slug}`}
              className={`sheen ${buttonVariants({ variant: "default", size: "lg" })}`}
            >
              <Play className="fill-current" /> Xem ngay
            </Link>
            <Link
              href={`/phim/${movie.slug}`}
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              <Info /> Chi tiết
            </Link>
          </motion.div>
        </div>

        {/* Cột poster */}
        <motion.div
          variants={item}
          className="relative mx-auto w-full max-w-sm md:max-w-md"
        >
          <div
            className="absolute -right-5 -top-5 h-full w-full rounded-2xl bg-[var(--color-primary)]/10"
            aria-hidden
          />
          <div className="animate-floaty relative aspect-[2/3] overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-muted)] shadow-2xl shadow-black/20">
            <Image
              src={posterUrl(movie.posterPath)}
              alt={movie.title}
              fill
              priority
              sizes="(max-width: 768px) 85vw, 480px"
              className="object-cover"
            />
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
