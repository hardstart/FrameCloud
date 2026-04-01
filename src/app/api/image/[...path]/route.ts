import { NextRequest, NextResponse } from "next/server";
import { getImageStream } from "@/lib/r2";
import { validateSession } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const pathParts = params.path;
  if (pathParts.length < 2) {
    return new NextResponse("Bad request", { status: 400 });
  }

  const slug = pathParts[0];
  const filename = pathParts.slice(1).join("/");

  // Cover images are public for gallery display
  const isCover = filename === "cover.jpg" || filename === "cover.png" || filename === "cover.webp";

  if (!isCover && !validateSession(slug)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const response = await getImageStream(slug, filename);
  if (!response || !response.Body) {
    return new NextResponse("Not found", { status: 404 });
  }

  const bytes = await response.Body.transformToByteArray();
  const contentType = response.ContentType || "image/jpeg";

  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": isCover
        ? "public, max-age=86400"
        : "private, max-age=3600",
    },
  });
}
