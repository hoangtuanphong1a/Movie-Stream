import {
  CreateGenreForm,
  DeleteGenreButton,
} from "@/components/admin/genre-manager";
import { listGenresAdmin } from "@/lib/admin-queries";

export const dynamic = "force-dynamic";

export default async function GenresPage() {
  const genres = await listGenresAdmin();

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold">Quản lý thể loại</h1>

      <div className="mb-6">
        <CreateGenreForm />
      </div>

      <ul className="divide-y divide-[var(--color-border)] overflow-hidden rounded-lg border border-[var(--color-border)]">
        {genres.map((g) => (
          <li
            key={g.id}
            className="flex items-center justify-between bg-[var(--color-card)] p-3"
          >
            <div>
              <span className="font-medium">{g.name}</span>
              <span className="ml-2 text-xs text-[var(--color-muted-foreground)]">
                {g._count.movies} phim · /{g.slug}
              </span>
            </div>
            <DeleteGenreButton id={g.id} />
          </li>
        ))}
      </ul>
    </div>
  );
}
