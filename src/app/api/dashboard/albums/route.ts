import { NextRequest, NextResponse } from "next/server";
import { db, albums } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";

// List albums for the current tenant
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db
    .select()
    .from(albums)
    .where(eq(albums.tenantId, session.tenantId))
    .orderBy(desc(albums.createdAt));

  return NextResponse.json({ albums: rows });
}

// Create a new album
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, description } = await req.json();
  if (!title?.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);

  const [album] = await db
    .insert(albums)
    .values({
      tenantId: session.tenantId,
      title: title.trim(),
      slug: `${slug}-${Date.now().toString(36)}`,
      description: description?.trim() || null,
    })
    .returning();

  return NextResponse.json({ album }, { status: 201 });
}
