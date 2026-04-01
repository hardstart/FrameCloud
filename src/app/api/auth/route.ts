import { NextRequest, NextResponse } from "next/server";
import { getAlbumManifest } from "@/lib/r2";
import { verifyPassword, createSessionCookie } from "@/lib/auth";

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }

  if (entry.count >= 5) return false;
  entry.count++;
  return true;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("cf-connecting-ip") || "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { success: false, error: "Too many attempts. Try again in a minute." },
      { status: 429 }
    );
  }

  try {
    const { slug, password } = await request.json();

    if (!slug || !password) {
      return NextResponse.json(
        { success: false, error: "Missing slug or password" },
        { status: 400 }
      );
    }

    const manifest = await getAlbumManifest(slug);
    if (!manifest) {
      return NextResponse.json(
        { success: false, error: "Album not found" },
        { status: 404 }
      );
    }

    if (!manifest.isPasswordProtected) {
      createSessionCookie(slug);
      return NextResponse.json({
        success: true,
        albumTitle: manifest.title,
        totalPhotos: manifest.totalPhotos,
      });
    }

    const valid = await verifyPassword(password, manifest.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { success: false, error: "Invalid password" },
        { status: 401 }
      );
    }

    createSessionCookie(slug);

    return NextResponse.json({
      success: true,
      albumTitle: manifest.title,
      totalPhotos: manifest.totalPhotos,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}
