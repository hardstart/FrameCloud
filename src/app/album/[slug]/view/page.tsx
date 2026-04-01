import { getAlbumManifest } from "@/lib/r2";
import { validateSession } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import ViewfinderExperience from "./ViewfinderExperience";

interface Props {
  params: { slug: string };
}

export default async function ViewPage({ params }: Props) {
  const { slug } = params;
  const manifest = await getAlbumManifest(slug);

  if (!manifest) {
    notFound();
  }

  // Check auth for protected albums
  if (manifest.isPasswordProtected && !validateSession(slug)) {
    redirect(`/album/${slug}`);
  }

  return (
    <ViewfinderExperience
      slug={slug}
      albumTitle={manifest.title}
      photos={manifest.photos}
      totalPhotos={manifest.totalPhotos}
      description={manifest.description}
    />
  );
}
