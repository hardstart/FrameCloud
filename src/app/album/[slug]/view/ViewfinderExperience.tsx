"use client";

import { lazy, Suspense } from "react";
import type { Photo } from "@/lib/types";

const CameraScrollExperience = lazy(
  () => import("@/components/camera/CameraScrollExperience")
);

interface ViewfinderExperienceProps {
  slug: string;
  albumTitle: string;
  photos: Photo[];
  totalPhotos: number;
  description?: string;
}

export default function ViewfinderExperience({
  slug,
  albumTitle,
  photos,
  totalPhotos,
}: ViewfinderExperienceProps) {
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 bg-black flex items-center justify-center">
          <span className="font-mono text-[10px] text-white/30 uppercase tracking-wider animate-pulse">
            Loading...
          </span>
        </div>
      }
    >
      <CameraScrollExperience
        slug={slug}
        albumTitle={albumTitle}
        photos={photos}
        totalPhotos={totalPhotos}
      />
    </Suspense>
  );
}
