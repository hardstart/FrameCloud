import { NextRequest, NextResponse } from "next/server";
import { db, shareLinks } from "@/lib/db";
import { eq, and, gt, or, isNull } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const { password } = await req.json();

  if (!password) {
    return NextResponse.json({ error: "Password is required" }, { status: 400 });
  }

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

  if (!link) {
    return NextResponse.json({ error: "Invalid or expired link" }, { status: 404 });
  }

  const valid = await bcrypt.compare(password, link.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  // Set a session cookie for this share link (24h)
  const cookieStore = cookies();
  cookieStore.set(`fc_share_${params.token}`, "authenticated", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 24 * 60 * 60,
    path: "/",
  });

  return NextResponse.json({ success: true });
}
