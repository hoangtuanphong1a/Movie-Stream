import { getCurrentUser } from "@/lib/session";
import { tmdbSearch } from "@/lib/tmdb";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  if (user.role !== "ADMIN") return new Response("Forbidden", { status: 403 });

  const q = new URL(req.url).searchParams.get("q") ?? "";
  if (!q.trim()) return Response.json([]);

  try {
    const results = await tmdbSearch(q);
    return Response.json(results);
  } catch (e) {
    return new Response(e instanceof Error ? e.message : "TMDB error", {
      status: 500,
    });
  }
}
