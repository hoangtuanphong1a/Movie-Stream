import Link from "next/link";
import { Film } from "lucide-react";
import { FadeIn } from "@/components/motion/reveal";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <FadeIn className="w-full max-w-sm">
        <Link
          href="/"
          className="mb-6 flex items-center justify-center gap-2 font-serif text-xl font-bold"
        >
          <Film className="size-7 text-[var(--color-primary)]" /> MovieStream
        </Link>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-xl">
          {children}
        </div>
      </FadeIn>
    </div>
  );
}
