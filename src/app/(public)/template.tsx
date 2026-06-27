"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

// template.tsx re-mount mỗi lần điều hướng → tạo hiệu ứng chuyển trang.
export default function PublicTemplate({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  if (reduce) return <>{children}</>;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
