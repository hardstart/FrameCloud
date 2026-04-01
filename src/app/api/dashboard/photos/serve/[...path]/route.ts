import { NextRequest, NextResponse } from "next/server";
import { getR2Object } from "@/lib/storage";
import { getSession } from "@/lib/auth/session";
import path from "path";

// Serve tenant photos: /api/dashboard/photos/serve/{r2Key...}
export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const r2Key = params.path.join("/");

  // Tenant isolation: key must start with tenant prefix
  if (!r2Key.startsWith(`tenants/${session.tenantId}/`)) {
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
      "Cache-Control": "private, max-age=3600",
    },
  });
}
