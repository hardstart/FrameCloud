import { NextResponse } from "next/server";
import { listAlbumSlugs, getAlbumManifest } from "@/lib/r2";
import type { AlbumPublicMeta } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const slugs = await listAlbumSlugs();
    const albums: AlbumPublicMeta[] = [];

    for (const slug of slugs) {
      const manifest = await getAlbumManifest(slug);
      if (!manifest) continue;

      albums.push({
        slug: manifest.slug,
        title: manifest.title,
        date: manifest.date,
        coverImage: `/api/image/${manifest.slug}/${manifest.coverImage}`,
        totalPhotos: manifest.totalPhotos,
        isPasswordProtected: manifest.isPasswordProtected,
        description: manifest.description,
      });
    }

    // Sort by date descending
    albums.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json(albums);
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}
