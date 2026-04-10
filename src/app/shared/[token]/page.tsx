import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { db, shareLinks, albums, photos } from "@/lib/db";
import { eq, and, gt, or, isNull } from "drizzle-orm";
import SharedAlbumView from "./SharedAlbumView";
import SharedPasswordGate from "./SharedPasswordGate";

export const dynamic = "force-dynamic";

interface Props {
  params: { token: string };
}

export default async function SharedAlbumPage({ params }: Props) {
  // Find active, non-expired share link
  const [link] = await db
    .select()
    .from(shareLinks)
    .where(
      and(
        eq(shareLinks.token, params.token),
        eq(shareLinks.isActive, true),
        or(isNull(shareLinks.expiresAt), gt(shareLinks.expiresAt, new Date()))
      )
    )
    .limit(1);

  if (!link) notFound();

  // Check if user has authenticated for this share link
  const cookieStore = cookies();
  const authCookie = cookieStore.get(`fc_share_${params.token}`);
  const isAuthenticated = authCookie?.value === "authenticated";

  if (!isAuthenticated) {
    // Show password gate
    const [album] = await db
      .select({ title: albums.title })
      .from(albums)
      .where(eq(albums.id, link.albumId))
      .limit(1);

    return <SharedPasswordGate token={params.token} albumTitle={album?.title || "Album"} />;
  }

  // Authenticated — show the album
  const [album] = await db
    .select()
    .from(albums)
    .where(eq(albums.id, link.albumId))
    .limit(1);

  if (!album) notFound();

  const albumPhotos = await db
    .select()
    .from(photos)
    .where(eq(photos.albumId, album.id))
    .orderBy(photos.sortOrder);

  return (
    <SharedAlbumView
      album={{ title: album.title, description: album.description, photoCount: album.photoCount }}
      photos={albumPhotos.map((p) => ({
        id: p.id,
        filename: p.filename,
        caption: p.caption,
        r2Key: p.r2Key,
      }))}
      token={params.token}
    />
  );
}
