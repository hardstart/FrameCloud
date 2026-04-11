"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import type { Photo as DBPhoto } from "@/lib/db/schema";
import type { Photo as ViewPhoto } from "@/lib/types";
import type { DarkroomPhoto } from "@/components/darkroom/useDarkroom";

const DarkroomViewer = dynamic(
  () => import("@/components/darkroom/DarkroomViewer"),
  { ssr: false }
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

  // Map album photos to darkroom format with R2 URLs
  const darkroomPhotos: DarkroomPhoto[] = useMemo(
    () =>
      photos.map((p) => ({
        photoUrl: `/api/dashboard/photos/serve/${photoKeys[p.filename]}`,
        subject: p.caption || p.filename,
      })),
    [photos, photoKeys]
  );

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
    <div className="fixed inset-0 z-[200] bg-black">
      <DarkroomViewer
        photos={darkroomPhotos}
        albumTitle={albumTitle}
        backHref={`/dashboard/albums/${id}`}
        backLabel="Back to Album"
      />
    </div>
  );

  if (!mounted) return null;
  return createPortal(content, document.body);
}
