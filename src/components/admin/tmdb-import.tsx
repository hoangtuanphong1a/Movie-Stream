"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";
import { importMovieFromTmdb } from "@/server/actions/admin";
import { posterUrl } from "@/lib/images";
import { getYear } from "@/lib/utils";

type Result = {
  id: number;
  title?: string;
  name?: string;
  release_date?: string;
  poster_path?: string | null;
};

export function TmdbImport() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; slug?: string } | null>(null);
  const [pending, start] = useTransition();
  const [importingId, setImportingId] = useState<number | null>(null);

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch(
        `/api/admin/tmdb/search?q=${encodeURIComponent(q)}`,
      );
      if (!res.ok) throw new Error();
      setResults(await res.json());
    } catch {
      setMsg({ text: "Tìm kiếm thất bại. Kiểm tra lại TMDB_API_KEY." });
    } finally {
      setLoading(false);
    }
  };

  const doImport = (id: number) => {
    setImportingId(id);
    start(async () => {
      const r = await importMovieFromTmdb(id);
      setImportingId(null);
      if (r.error) setMsg({ text: r.error });
      else setMsg({ text: "Import thành công!", slug: r.slug });
    });
  };

  return (
    <div>
      <form onSubmit={search} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Nhập tên phim trên TMDB..."
            className="h-10 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-muted)] pl-9 pr-3 text-sm outline-none focus:border-[var(--color-primary)]"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-[var(--color-primary)] px-5 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? "Đang tìm..." : "Tìm"}
        </button>
      </form>

      {msg && (
        <p className="mt-3 rounded-md bg-[var(--color-muted)] px-3 py-2 text-sm">
          {msg.text}{" "}
          {msg.slug && (
            <Link
              href={`/admin/phim`}
              className="text-[var(--color-primary)] hover:underline"
            >
              → Quản lý phim
            </Link>
          )}
        </p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {results.map((r) => (
          <div
            key={r.id}
            className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-card)]"
          >
            <div className="relative aspect-[2/3]">
              <Image
                src={posterUrl(r.poster_path)}
                alt={r.title ?? r.name ?? ""}
                fill
                sizes="200px"
                className="object-cover"
              />
            </div>
            <div className="p-2">
              <p className="line-clamp-2 text-sm font-medium">
                {r.title ?? r.name}
              </p>
              <p className="text-xs text-[var(--color-muted-foreground)]">
                {getYear(r.release_date)}
              </p>
              <button
                onClick={() => doImport(r.id)}
                disabled={pending}
                className="mt-2 w-full rounded-md bg-[var(--color-primary)] py-1.5 text-xs font-medium text-white disabled:opacity-50"
              >
                {pending && importingId === r.id ? "Đang import..." : "Import"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
