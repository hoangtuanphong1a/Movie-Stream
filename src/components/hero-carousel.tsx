"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type Variants,
} from "framer-motion";
import { Play, Info, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { posterUrl, backdropUrl } from "@/lib/images";
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
const INTERVAL = 6000;

// Stagger cho cột chữ — hiện lần lượt mỗi khi đổi slide.
const textGroup: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.06 } },
};
const textItem: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

export function HeroCarousel({ movies }: { movies: HeroMovie[] }) {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = movies.length;

  // Tilt 3D cho poster (parallax theo con trỏ).
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const spring = { stiffness: 140, damping: 18, mass: 0.4 };
  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [9, -9]), spring);
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-11, 11]), spring);

  const onPosterMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (reduce) return;
      const r = e.currentTarget.getBoundingClientRect();
      px.set((e.clientX - r.left) / r.width - 0.5);
      py.set((e.clientY - r.top) / r.height - 0.5);
    },
    [px, py, reduce],
  );
  const onPosterLeave = useCallback(() => {
    px.set(0);
    py.set(0);
  }, [px, py]);

  const go = useCallback(
    (dir: 1 | -1) => setIndex((i) => (i + dir + count) % count),
    [count],
  );

  // Tự chuyển slide.
  useEffect(() => {
    if (reduce || paused || count < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % count), INTERVAL);
    return () => clearInterval(id);
  }, [reduce, paused, count]);

  // Tạm dừng khi đổi tab.
  useEffect(() => {
    const onVis = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  if (count === 0) return null;
  const movie = movies[index];

  return (
    <section
      className="relative overflow-hidden border-b border-[var(--color-border)]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
    >
      {/* Nền ambient: backdrop của chính phim, làm mờ + nhạt, đổi sắc theo slide */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <AnimatePresence>
          <motion.div
            key={movie.slug}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.1, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <Image
              src={backdropUrl(movie.backdropPath)}
              alt=""
              fill
              sizes="100vw"
              aria-hidden
              className="scale-110 object-cover opacity-30 blur-3xl saturate-150"
            />
          </motion.div>
        </AnimatePresence>
        {/* Lớp phủ trắng giữ tông sáng editorial + chữ luôn đọc rõ */}
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-background)] via-[var(--color-background)]/70 to-[var(--color-background)]/30" />
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-background)]/40 via-transparent to-[var(--color-background)]" />
      </div>

      <div className="relative mx-auto min-h-[560px] max-w-[1400px] px-4 py-12 md:min-h-[620px] md:px-8 md:py-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={movie.slug}
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduce ? undefined : { opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="grid items-center gap-10 md:grid-cols-2 md:gap-16"
          >
            {/* Chữ — stagger từng dòng */}
            <motion.div
              variants={reduce ? undefined : textGroup}
              initial={reduce ? false : "hidden"}
              animate="show"
            >
              <motion.span
                variants={textItem}
                className="inline-block text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-foreground)]"
              >
                Phim nổi bật
              </motion.span>
              <motion.h1
                variants={textItem}
                className="mt-4 font-serif text-4xl font-bold leading-[1.03] tracking-tight md:text-6xl lg:text-7xl"
              >
                {movie.title}
              </motion.h1>
              <motion.div
                variants={textItem}
                className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[var(--color-muted-foreground)]"
              >
                <span className="inline-flex items-center gap-1 font-semibold text-[var(--color-foreground)]">
                  <Star className="size-4 fill-[var(--color-foreground)]" />
                  {movie.voteAverage.toFixed(1)}
                </span>
                <span>{getYear(movie.releaseDate)}</span>
                <span className="h-1 w-1 rounded-full bg-[var(--color-border)]" />
                <span className="line-clamp-1">
                  {movie.genres.map((g) => g.genre.name).join(" · ")}
                </span>
              </motion.div>
              <motion.p
                variants={textItem}
                className="mt-5 max-w-prose text-base leading-relaxed text-[var(--color-muted-foreground)] line-clamp-3"
              >
                {movie.overview}
              </motion.p>
              <motion.div
                variants={textItem}
                className="mt-8 flex flex-wrap gap-3"
              >
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
            </motion.div>

            {/* Poster — glow halo + Ken Burns + tilt 3D */}
            <div
              className="relative mx-auto w-full max-w-sm [perspective:1000px] md:max-w-md"
              onMouseMove={onPosterMove}
              onMouseLeave={onPosterLeave}
            >
              {/* Halo màu lấy từ backdrop của phim */}
              <div
                aria-hidden
                className="absolute -inset-6 -z-10 opacity-60 blur-2xl"
              >
                <Image
                  src={backdropUrl(movie.backdropPath)}
                  alt=""
                  fill
                  sizes="480px"
                  className="rounded-[2rem] object-cover saturate-150"
                />
              </div>
              <motion.div
                style={
                  reduce
                    ? undefined
                    : { rotateX, rotateY, transformStyle: "preserve-3d" }
                }
                className="relative aspect-[2/3] overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-muted)] shadow-2xl shadow-black/25"
              >
                <Image
                  src={posterUrl(movie.posterPath)}
                  alt={movie.title}
                  fill
                  priority
                  sizes="(max-width: 768px) 85vw, 480px"
                  className="animate-kenburns object-cover"
                />
                {/* Ánh sáng kính nhẹ trên poster */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-black/15 via-transparent to-white/15" />
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>

        {count > 1 && (
          <>
            {/* Bộ đếm slide */}
            <div className="absolute right-4 top-12 z-10 hidden font-serif text-sm tabular-nums text-[var(--color-muted-foreground)] md:right-8 md:top-16 md:block">
              <span className="text-[var(--color-foreground)]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="mx-1">/</span>
              <span>{String(count).padStart(2, "0")}</span>
            </div>

            <button
              onClick={() => go(-1)}
              aria-label="Phim trước"
              className="absolute left-2 top-1/2 z-10 hidden -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-card)]/80 p-2 backdrop-blur transition-colors hover:bg-[var(--color-accent)] md:flex"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              onClick={() => go(1)}
              aria-label="Phim sau"
              className="absolute right-2 top-1/2 z-10 hidden -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-card)]/80 p-2 backdrop-blur transition-colors hover:bg-[var(--color-accent)] md:flex"
            >
              <ChevronRight className="size-5" />
            </button>

            {/* Dots — dot đang chạy có thanh tiến trình autoplay */}
            <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2">
              {movies.map((m, i) =>
                i === index ? (
                  <span
                    key={m.slug}
                    className="h-1.5 w-8 overflow-hidden rounded-full bg-[var(--color-border)]"
                  >
                    {reduce ? (
                      <span className="block h-full w-full rounded-full bg-[var(--color-foreground)]" />
                    ) : (
                      <span
                        key={`${index}-${paused}`}
                        className="hero-progress block h-full w-full rounded-full bg-[var(--color-foreground)]"
                        style={{
                          animationDuration: `${INTERVAL}ms`,
                          animationPlayState: paused ? "paused" : "running",
                        }}
                      />
                    )}
                  </span>
                ) : (
                  <button
                    key={m.slug}
                    onClick={() => setIndex(i)}
                    aria-label={`Tới phim ${i + 1}`}
                    className="h-1.5 w-3 cursor-pointer rounded-full bg-[var(--color-border)] transition-colors hover:bg-[var(--color-muted-foreground)]"
                  />
                ),
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
