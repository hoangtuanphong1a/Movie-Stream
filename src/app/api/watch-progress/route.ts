import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: {
    movieId?: string;
    episodeId?: string | null;
    progressSeconds?: number;
    durationSeconds?: number;
  };
  try {
    body = await req.json();
  } catch {
    return new Response("Bad Request", { status: 400 });
  }

  const { movieId, episodeId, progressSeconds, durationSeconds } = body;
  if (!movieId || typeof progressSeconds !== "number") {
    return new Response("Bad Request", { status: 400 });
  }

  const userId = session.user.id;
  const existing = await prisma.watchHistory.findFirst({
    where: { userId, movieId, episodeId: episodeId ?? null },
  });

  if (existing) {
    await prisma.watchHistory.update({
      where: { id: existing.id },
      data: {
        progressSeconds,
        durationSeconds: durationSeconds ?? existing.durationSeconds,
      },
    });
  } else {
    await prisma.watchHistory.create({
      data: {
        userId,
        movieId,
        episodeId: episodeId ?? null,
        progressSeconds,
        durationSeconds: durationSeconds ?? 0,
      },
    });
    // Tính 1 lượt xem khi bắt đầu xem lần đầu.
    await prisma.movie.update({
      where: { id: movieId },
      data: { viewCount: { increment: 1 } },
    });
  }

  return Response.json({ ok: true });
}
