import "server-only";

const BASE = "https://api.themoviedb.org/3";
const API_KEY = process.env.TMDB_API_KEY;
const TOKEN = process.env.TMDB_ACCESS_TOKEN;

export function isTmdbConfigured(): boolean {
  return Boolean(API_KEY || TOKEN);
}

async function tmdbFetch(path: string, params: Record<string, string> = {}) {
  if (!isTmdbConfigured()) {
    throw new Error("Chưa cấu hình TMDB_API_KEY trong .env");
  }
  const sp = new URLSearchParams({ language: "vi-VN", ...params });
  if (API_KEY) sp.set("api_key", API_KEY);

  const res = await fetch(`${BASE}${path}?${sp.toString()}`, {
    headers: TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {},
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`TMDB lỗi ${res.status}`);
  }
  return res.json();
}

export type TmdbSearchResult = {
  id: number;
  title?: string;
  name?: string;
  release_date?: string;
  poster_path?: string | null;
  overview?: string;
  vote_average?: number;
};

export async function tmdbSearch(query: string): Promise<TmdbSearchResult[]> {
  const data = await tmdbFetch("/search/movie", {
    query,
    include_adult: "false",
  });
  return data.results ?? [];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function tmdbMovieDetails(id: number): Promise<any> {
  return tmdbFetch(`/movie/${id}`, {
    append_to_response: "credits,videos",
  });
}
