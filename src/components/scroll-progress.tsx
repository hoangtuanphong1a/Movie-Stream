"use client";

import { motion, useScroll, useSpring, useReducedMotion } from "framer-motion";

/** Thanh tiến trình cuộn mảnh ở đỉnh trang. */
export function ScrollProgress() {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    mass: 0.2,
  });
  if (reduce) return null;
  return (
    <motion.div
      style={{ scaleX }}
      className="fixed left-0 top-0 z-[60] h-0.5 w-full origin-left bg-[var(--color-foreground)]"
      aria-hidden
    />
  );
}
