"use client";

import { useEffect, useState, lazy, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import type { Photo as DBPhoto } from "@/lib/db/schema";
import type { Photo as ViewPhoto } from "@/lib/types";

const CameraScrollExperience = lazy(
  () => import("@/components/camera/CameraScrollExperience")
);

export default function DashboardAlbumViewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [albumTitle, setAlbumTitle] = useState("");
  const [photos, setPhotos] = useState<ViewPhoto[]>([]);
  const [photoKeys, setPhotoKeys] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/dashboard/albums/${id}`);
      if (!res.ok) {
        router.push("/dashboard");
        return;
      }
      const data = await res.json();
      setAlbumTitle(data.album.title);

      const viewPhotos: ViewPhoto[] = [];
      const keys: Record<string, string> = {};

      (data.photos as DBPhoto[]).forEach((p) => {
        viewPhotos.push({
          filename: p.filename,
          caption: p.caption || undefined,
        });
        keys[p.filename] = p.r2Key;
      });

      setPhotos(viewPhotos);
      setPhotoKeys(keys);
      setLoading(false);
    }
    load();
  }, [id, router]);

  function getImageUrl(photo: ViewPhoto) {
    const r2Key = photoKeys[photo.filename];
    return `/api/dashboard/photos/serve/${r2Key}`;
  }

  const content = loading ? (
    <div className="fixed inset-0 z-[200] bg-black flex items-center justify-center">
      <span className="font-mono text-[10px] text-white/30 uppercase tracking-wider animate-pulse">
        Loading...
      </span>
    </div>
  ) : photos.length === 0 ? (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center gap-4">
      <p className="font-mono text-sm text-white/40 uppercase tracking-wider">
        No photos in this album
      </p>
      <button
        onClick={() => router.push(`/dashboard/albums/${id}`)}
        className="font-mono text-xs text-white/60 uppercase tracking-wider hover:text-white transition-colors"
      >
        &larr; Back to Album
      </button>
    </div>
  ) : (
    <div className="fixed inset-0 z-[200] bg-black overflow-y-auto">
      <Suspense
        fallback={
          <div className="fixed inset-0 bg-black flex items-center justify-center">
            <span className="font-mono text-[10px] text-white/30 uppercase tracking-wider animate-pulse">
              Loading viewfinder...
            </span>
          </div>
        }
      >
        <CameraScrollExperience
          slug={id}
          albumTitle={albumTitle}
          photos={photos}
          totalPhotos={photos.length}
          getImageUrl={getImageUrl}
          backHref={`/dashboard/albums/${id}`}
          backLabel="Back to Album"
        />
      </Suspense>
    </div>
  );

  if (!mounted) return null;
  return createPortal(content, document.body);
}
