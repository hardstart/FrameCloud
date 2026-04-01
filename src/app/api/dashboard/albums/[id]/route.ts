import { NextRequest, NextResponse } from "next/server";
import { db, albums, photos, shareLinks } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { deleteR2Object } from "@/lib/storage";

// Get single album
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [album] = await db
    .select()
    .from(albums)
    .where(and(eq(albums.id, params.id), eq(albums.tenantId, session.tenantId)))
    .limit(1);

  if (!album) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const albumPhotos = await db
    .select()
    .from(photos)
    .where(eq(photos.albumId, album.id))
    .orderBy(photos.sortOrder);

  const links = await db
    .select()
    .from(shareLinks)
    .where(eq(shareLinks.albumId, album.id));

  return NextResponse.json({ album, photos: albumPhotos, shareLinks: links });
}

// Update album
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const updates: Record<string, unknown> = { updatedAt: new Date() };

  if (body.title !== undefined) updates.title = body.title.trim();
  if (body.description !== undefined) updates.description = body.description?.trim() || null;
  if (body.coverKey !== undefined) updates.coverKey = body.coverKey;

  const [album] = await db
    .update(albums)
    .set(updates)
    .where(and(eq(albums.id, params.id), eq(albums.tenantId, session.tenantId)))
    .returning();

  if (!album) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ album });
}

// Delete album
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get all photos to delete from R2
  const albumPhotos = await db
    .select({ r2Key: photos.r2Key })
    .from(photos)
    .where(and(eq(photos.albumId, params.id), eq(photos.tenantId, session.tenantId)));

  // Delete from R2
  for (const photo of albumPhotos) {
    await deleteR2Object(photo.r2Key);
  }

  // Delete album (cascades to photos and share_links)
  const [deleted] = await db
    .delete(albums)
    .where(and(eq(albums.id, params.id), eq(albums.tenantId, session.tenantId)))
    .returning({ id: albums.id });

  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ success: true });
}
