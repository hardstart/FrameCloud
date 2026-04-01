import { getAlbumManifest } from "@/lib/r2";
import { validateSession } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import AlbumEntry from "./AlbumEntry";

interface Props {
  params: { slug: string };
}

export default async function AlbumPage({ params }: Props) {
  const { slug } = params;
  const manifest = await getAlbumManifest(slug);

  if (!manifest) {
    notFound();
  }

  // If already authenticated, go straight to viewfinder
  if (validateSession(slug)) {
    redirect(`/album/${slug}/view`);
  }

  // If no password protection, create session and redirect
  if (!manifest.isPasswordProtected) {
    redirect(`/album/${slug}/view`);
  }

  return (
    <AlbumEntry
      slug={slug}
      albumTitle={manifest.title}
      totalPhotos={manifest.totalPhotos}
    />
  );
}
