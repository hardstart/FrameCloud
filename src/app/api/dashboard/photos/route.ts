import { NextRequest, NextResponse } from "next/server";
import { db, photos, albums } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { uploadToR2, getPhotoR2Key } from "@/lib/storage";
import { v4 as uuidv4 } from "uuid";

// Upload photos to an album
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const albumId = formData.get("albumId") as string;

  if (!albumId) {
    return NextResponse.json({ error: "Album ID is required" }, { status: 400 });
  }

  // Verify album belongs to tenant
  const [album] = await db
    .select()
    .from(albums)
    .where(and(eq(albums.id, albumId), eq(albums.tenantId, session.tenantId)))
    .limit(1);

  if (!album) return NextResponse.json({ error: "Album not found" }, { status: 404 });

  const files = formData.getAll("files") as File[];
  if (files.length === 0) {
    return NextResponse.json({ error: "No files provided" }, { status: 400 });
  }

  const uploaded: Array<{ id: string; filename: string; r2Key: string }> = [];

  for (const file of files) {
    if (!file.type.startsWith("image/")) continue;

    const ext = file.name.split(".").pop() || "jpg";
    const uniqueName = `${uuidv4()}.${ext}`;
    const r2Key = getPhotoR2Key(session.tenantId, albumId, uniqueName);

    const buffer = Buffer.from(await file.arrayBuffer());
    await uploadToR2(r2Key, buffer, file.type);

    const currentMax = await db
      .select({ sortOrder: photos.sortOrder })
      .from(photos)
      .where(eq(photos.albumId, albumId))
      .orderBy(photos.sortOrder)
      .limit(1);

    const nextOrder = (currentMax[0]?.sortOrder ?? -1) + 1;

    const [photo] = await db
      .insert(photos)
      .values({
        albumId,
        tenantId: session.tenantId,
        filename: file.name,
        r2Key,
        sizeBytes: buffer.length,
        sortOrder: nextOrder,
      })
      .returning();

    uploaded.push({ id: photo.id, filename: photo.filename, r2Key: photo.r2Key });
  }

  // Update album photo count
  const countResult = await db
    .select({ r2Key: photos.r2Key })
    .from(photos)
    .where(eq(photos.albumId, albumId));

  await db
    .update(albums)
    .set({ photoCount: countResult.length, updatedAt: new Date() })
    .where(eq(albums.id, albumId));

  // Set cover if album has none
  if (!album.coverKey && uploaded.length > 0) {
    await db
      .update(albums)
      .set({ coverKey: uploaded[0].r2Key })
      .where(eq(albums.id, albumId));
  }

  return NextResponse.json({ uploaded, count: uploaded.length }, { status: 201 });
}
