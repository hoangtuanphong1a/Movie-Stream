import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.AUTH_URL ?? "http://localhost:3000";

  const movies = await prisma.movie.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true, updatedAt: true },
  });

  const staticRoutes: MetadataRoute.Sitemap = ["", "/duyet", "/tim-kiem"].map(
    (p) => ({ url: `${base}${p}`, lastModified: new Date() }),
  );

  const movieRoutes: MetadataRoute.Sitemap = movies.map((m) => ({
    url: `${base}/phim/${m.slug}`,
    lastModified: m.updatedAt,
  }));

  return [...staticRoutes, ...movieRoutes];
}
