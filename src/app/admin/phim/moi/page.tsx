import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { listGenresAdmin } from "@/lib/admin-queries";
import { MovieForm } from "@/components/admin/movie-form";

export const dynamic = "force-dynamic";

export default async function NewMoviePage() {
  const genres = await listGenresAdmin();

  return (
    <div>
      <Link
        href="/admin/phim"
        className="mb-4 inline-flex items-center gap-1 text-sm text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-foreground)]"
      >
        <ChevronLeft className="size-4" /> Danh sách phim
      </Link>
      <h1 className="mb-6 font-serif text-3xl font-bold tracking-tight">
        Thêm phim mới
      </h1>
      <MovieForm genres={genres.map((g) => ({ id: g.id, name: g.name }))} />
    </div>
  );
}
