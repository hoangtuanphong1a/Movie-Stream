"use client";

import { MotionConfig } from "framer-motion";

/**
 * Ép bật hiệu ứng chuyển động bất kể cài đặt "giảm chuyển động" của hệ điều hành.
 * (Nhiều máy Windows tắt "Animation effects" khiến prefers-reduced-motion = reduce,
 *  làm mất toàn bộ animation. Với đồ án/demo ta muốn luôn thấy hiệu ứng.)
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="never">{children}</MotionConfig>;
}
