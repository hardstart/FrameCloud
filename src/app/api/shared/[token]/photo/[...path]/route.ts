import { NextRequest, NextResponse } from "next/server";
import { db, shareLinks } from "@/lib/db";
import { eq, and, gt, or, isNull } from "drizzle-orm";
import { getR2Object } from "@/lib/storage";
import path from "path";

// Serve photos for shared albums (public, no auth required)
export async function GET(
  req: NextRequest,
  { params }: { params: { token: string; path: string[] } }
) {
  // Validate share link
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

  if (!link) return NextResponse.json({ error: "Invalid or expired link" }, { status: 403 });

  const r2Key = params.path.join("/");

  // Ensure key belongs to the correct tenant
  if (!r2Key.startsWith(`tenants/${link.tenantId}/`)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const response = await getR2Object(r2Key);
  if (!response?.Body) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const bytes = await response.Body.transformToByteArray();
  const ext = path.extname(r2Key).toLowerCase();
  const contentType =
    ext === ".png" ? "image/png" :
    ext === ".webp" ? "image/webp" :
    ext === ".gif" ? "image/gif" :
    "image/jpeg";

  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400",
    },
  });
}
