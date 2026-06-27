const TMDB_IMAGE_BASE =
  process.env.NEXT_PUBLIC_TMDB_IMAGE_BASE ?? "https://image.tmdb.org/t/p";

const PLACEHOLDER_POSTER =
  "https://placehold.co/500x750/141414/3f3f46?text=No+Image";
const PLACEHOLDER_BACKDROP =
  "https://placehold.co/1280x720/0a0a0a/3f3f46?text=No+Image";
const PLACEHOLDER_PROFILE =
  "https://placehold.co/300x450/141414/3f3f46?text=N/A";

function build(
  path: string | null | undefined,
  size: string,
  placeholder: string,
): string {
  if (!path) return placeholder;
  if (path.startsWith("http")) return path; // URL đầy đủ (dữ liệu seed)
  return `${TMDB_IMAGE_BASE}/${size}${path}`; // path TMDB (vd /abc.jpg)
}

export function posterUrl(path?: string | null, size = "w500") {
  return build(path, size, PLACEHOLDER_POSTER);
}

export function backdropUrl(path?: string | null, size = "w1280") {
  return build(path, size, PLACEHOLDER_BACKDROP);
}

export function profileUrl(path?: string | null, size = "w185") {
  return build(path, size, PLACEHOLDER_PROFILE);
}
