"use client";

import { useEffect, useRef } from "react";
import AlbumCard from "./AlbumCard";
import type { AlbumPublicMeta } from "@/lib/types";

export default function GalleryGrid({ albums }: { albums: AlbumPublicMeta[] }) {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!gridRef.current || albums.length === 0) return;

    let cleanup: (() => void) | undefined;

    const init = async () => {
      const gsap          = (await import("gsap")).default;
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      if (!gridRef.current) return;
      const cards = gridRef.current.querySelectorAll<HTMLElement>(".album-card-item");

      const ctx = gsap.context(() => {
        gsap.fromTo(
          cards,
          { opacity: 0, y: 36 },
          {
            opacity: 1,
            y: 0,
            duration: 0.75,
            stagger: 0.09,
            ease: "power3.out",
            scrollTrigger: {
              trigger: gridRef.current,
              start: "top 88%",
              once: true,
            },
          }
        );
      }, gridRef.current);

      cleanup = () => ctx.revert();
    };

    init();
    return () => cleanup?.();
  }, [albums]);

  if (albums.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p
          className="font-mono uppercase"
          style={{ fontSize: 11, letterSpacing: "0.25em", color: "rgba(255,255,255,0.2)" }}
        >
          No albums yet
        </p>
      </div>
    );
  }

  const [featured, ...rest] = albums;

  return (
    <div ref={gridRef} className="space-y-3 sm:space-y-4">
      {/* Featured album — full-width cinematic banner */}
      <div className="album-card-item" style={{ opacity: 0 }}>
        <AlbumCard album={featured} index={0} featured />
      </div>

      {/* Remaining albums — 2-column grid for larger, more immersive cards */}
      {rest.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {rest.map((album, i) => (
            <div key={album.slug} className="album-card-item" style={{ opacity: 0 }}>
              <AlbumCard album={album} index={i + 1} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
