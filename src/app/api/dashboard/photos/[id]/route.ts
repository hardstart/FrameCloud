import { NextRequest, NextResponse } from "next/server";
import { db, photos, albums } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { deleteR2Object } from "@/lib/storage";

// Delete a photo
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [photo] = await db
    .select()
    .from(photos)
    .where(and(eq(photos.id, params.id), eq(photos.tenantId, session.tenantId)))
    .limit(1);

  if (!photo) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Delete from R2
  await deleteR2Object(photo.r2Key);

  // Delete from DB
  await db.delete(photos).where(eq(photos.id, params.id));

  // Update album photo count
  const remaining = await db
    .select({ id: photos.id })
    .from(photos)
    .where(eq(photos.albumId, photo.albumId));

  await db
    .update(albums)
    .set({ photoCount: remaining.length, updatedAt: new Date() })
    .where(eq(albums.id, photo.albumId));

  return NextResponse.json({ success: true });
}

// Update photo (caption, sort order)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const updates: Record<string, unknown> = {};

  if (body.caption !== undefined) updates.caption = body.caption;
  if (body.sortOrder !== undefined) updates.sortOrder = body.sortOrder;

  const [photo] = await db
    .update(photos)
    .set(updates)
    .where(and(eq(photos.id, params.id), eq(photos.tenantId, session.tenantId)))
    .returning();

  if (!photo) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ photo });
}
