import { NextRequest, NextResponse } from "next/server";
import { db, shareLinks, albums } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { getSession, generateToken } from "@/lib/auth/session";
import bcrypt from "bcryptjs";

// Create a share link
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { albumId, password, expiresInDays } = await req.json();
  if (!albumId) {
    return NextResponse.json({ error: "Album ID is required" }, { status: 400 });
  }
  if (!password || password.length < 4) {
    return NextResponse.json({ error: "Password is required (min. 4 characters)" }, { status: 400 });
  }

  // Verify album belongs to tenant
  const [album] = await db
    .select({ id: albums.id })
    .from(albums)
    .where(and(eq(albums.id, albumId), eq(albums.tenantId, session.tenantId)))
    .limit(1);

  if (!album) return NextResponse.json({ error: "Album not found" }, { status: 404 });

  const token = generateToken();
  const passwordHash = await bcrypt.hash(password, 10);
  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
    : null;

  const [link] = await db
    .insert(shareLinks)
    .values({
      albumId,
      tenantId: session.tenantId,
      token,
      passwordHash,
      expiresAt,
    })
    .returning();

  return NextResponse.json({ shareLink: link }, { status: 201 });
}

// Revoke a share link
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const linkId = searchParams.get("id");
  if (!linkId) {
    return NextResponse.json({ error: "Link ID is required" }, { status: 400 });
  }

  const [deleted] = await db
    .delete(shareLinks)
    .where(and(eq(shareLinks.id, linkId), eq(shareLinks.tenantId, session.tenantId)))
    .returning({ id: shareLinks.id });

  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ success: true });
}
