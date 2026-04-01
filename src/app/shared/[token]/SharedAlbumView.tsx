"use client";

import { useState } from "react";
import Link from "next/link";

interface Props {
  album: { title: string; description: string | null; photoCount: number };
  photos: Array<{ id: string; filename: string; caption: string | null; r2Key: string }>;
  token: string;
}

export default function SharedAlbumView({ album, photos, token }: Props) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  function getPhotoUrl(r2Key: string) {
    return `/api/shared/${token}/photo/${encodeURIComponent(r2Key)}`;
  }

  return (
    <main className="min-h-screen" style={{ background: "#0A0A0A" }}>
      <div className="film-grain-overlay" aria-hidden="true" />

      {/* Header */}
      <header
        className="sticky top-0 z-50"
        style={{
          background: "rgba(10,10,10,0.92)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(255,255,255,0.045)",
        }}
      >
        <div className="flex items-center justify-between px-6 sm:px-10 py-4 max-w-[1400px] mx-auto">
          <Link href="/" className="flex items-center gap-3">
            <span className="font-mono uppercase" style={{ fontSize: 11, letterSpacing: "0.32em", color: "rgba(255,184,0,0.7)" }}>◆</span>
            <span className="font-mono uppercase" style={{ fontSize: 11, letterSpacing: "0.28em", color: "rgba(245,245,245,0.75)" }}>FrameCloud</span>
          </Link>
          <span className="font-mono uppercase" style={{ fontSize: 9, letterSpacing: "0.2em", color: "rgba(255,255,255,0.2)" }}>
            Shared Album
          </span>
        </div>
      </header>

      <div className="px-6 sm:px-10 lg:px-14 py-10 max-w-[1400px] mx-auto">
        {/* Album info */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div style={{ width: 28, height: 1, background: "rgba(255,184,0,0.3)" }} />
            <span className="font-mono uppercase" style={{ fontSize: 9, letterSpacing: "0.3em", color: "rgba(255,184,0,0.4)" }}>
              Shared Collection
            </span>
          </div>
          <h1 className="font-sans font-semibold" style={{ fontSize: 32, color: "#F5F5F5" }}>{album.title}</h1>
          {album.description && (
            <p className="font-mono mt-2" style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>{album.description}</p>
          )}
          <span className="font-mono block mt-2" style={{ fontSize: 10, color: "rgba(255,184,0,0.35)" }}>
            {photos.length} frames
          </span>
        </div>

        {/* Photo grid */}
        {photos.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-mono" style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>This album is empty.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {photos.map((photo, idx) => (
              <div
                key={photo.id}
                className="group relative rounded overflow-hidden cursor-pointer"
                style={{ aspectRatio: "1", background: "#0D0D0D" }}
                onClick={() => setLightboxIdx(idx)}
              >
                <img
                  src={getPhotoUrl(photo.r2Key)}
                  alt={photo.caption || photo.filename}
                  className="w-full h-full object-cover transition-transform group-hover:scale-[1.03]"
                  loading="lazy"
                />
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2"
                  style={{ background: "linear-gradient(transparent 50%, rgba(0,0,0,0.7))" }}
                >
                  <span className="font-mono truncate" style={{ fontSize: 10, color: "rgba(255,255,255,0.7)" }}>
                    {photo.caption || photo.filename}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxIdx !== null && photos[lightboxIdx] && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.95)" }}
          onClick={() => setLightboxIdx(null)}
        >
          <button
            className="absolute top-6 right-6 font-mono z-10"
            style={{ fontSize: 24, color: "rgba(255,255,255,0.5)" }}
            onClick={() => setLightboxIdx(null)}
          >
            ×
          </button>

          {lightboxIdx > 0 && (
            <button
              className="absolute left-6 top-1/2 -translate-y-1/2 font-mono z-10 p-2"
              style={{ fontSize: 28, color: "rgba(255,255,255,0.4)" }}
              onClick={(e) => { e.stopPropagation(); setLightboxIdx(lightboxIdx - 1); }}
            >
              ‹
            </button>
          )}

          {lightboxIdx < photos.length - 1 && (
            <button
              className="absolute right-6 top-1/2 -translate-y-1/2 font-mono z-10 p-2"
              style={{ fontSize: 28, color: "rgba(255,255,255,0.4)" }}
              onClick={(e) => { e.stopPropagation(); setLightboxIdx(lightboxIdx + 1); }}
            >
              ›
            </button>
          )}

          <img
            src={getPhotoUrl(photos[lightboxIdx].r2Key)}
            alt={photos[lightboxIdx].caption || photos[lightboxIdx].filename}
            className="max-h-[85vh] max-w-[90vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          <div
            className="absolute bottom-0 left-0 right-0 flex items-center justify-center px-6 py-4"
            style={{ background: "rgba(0,0,0,0.7)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <span className="font-mono" style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
              {photos[lightboxIdx].caption || photos[lightboxIdx].filename}
            </span>
            <span className="font-mono ml-4" style={{ fontSize: 10, color: "rgba(255,184,0,0.4)" }}>
              {lightboxIdx + 1} / {photos.length}
            </span>
          </div>
        </div>
      )}
    </main>
  );
}
