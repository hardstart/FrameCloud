"use client";

import { useRouter } from "next/navigation";
import CameraBack from "@/components/camera/CameraBack";
import LCDScreen from "@/components/camera/LCDScreen";

interface AlbumEntryProps {
  slug: string;
  albumTitle: string;
  totalPhotos: number;
}

/**
 * Album entry page: cinematic camera hero shot in upper portion,
 * password authentication form below, both on pure black background.
 */
export default function AlbumEntry({ slug, albumTitle, totalPhotos }: AlbumEntryProps) {
  const router = useRouter();

  const handleAuthenticated = () => {
    router.push(`/album/${slug}/view`);
  };

  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center gap-8 sm:gap-12 p-6">
      {/* Camera hero shot — 3/4 angle, cinematic lighting */}
      <div className="w-full max-w-[600px]">
        <CameraBack className="w-full" />
      </div>

      {/* Authentication form — styled as camera menu interface */}
      <LCDScreen
        slug={slug}
        albumTitle={albumTitle}
        totalPhotos={totalPhotos}
        onAuthenticated={handleAuthenticated}
      />
    </main>
  );
}
