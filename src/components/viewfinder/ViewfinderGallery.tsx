"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import ViewfinderTunnel from "./ViewfinderTunnel";
import type { Photo } from "@/lib/types";

interface ViewfinderGalleryProps {
  slug: string;
  albumTitle: string;
  photos: Photo[];
  totalPhotos: number;
  description?: string;
  onEnter: () => void;
}

// ─── Tilt card — individual photo thumbnail with perspective tilt on hover ──
function TiltCard({
  src,
  alt,
  index,
  onEnter,
}: {
  src: string;
  alt: string;
  index: number;
  onEnter: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width  - 0.5;
    const y = (e.clientY - rect.top)  / rect.height - 0.5;
    card.style.transform = `perspective(500px) rotateY(${x * 18}deg) rotateX(${-y * 18}deg) scale(1.05)`;
    card.style.zIndex = "2";
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = "perspective(500px) rotateY(0deg) rotateX(0deg) scale(1)";
    card.style.zIndex = "1";
  };

  return (
    <div
      ref={cardRef}
      className="relative overflow-hidden rounded cursor-pointer"
      style={{
        aspectRatio: "3/2",
        transition: "transform 0.12s ease-out",
        willChange: "transform",
        // Stagger opacity animation by index
        opacity: 0,
        animation: `vfg-fade-up 0.4s ease ${0.05 * index}s forwards`,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onEnter}
    >
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 33vw, 160px"
        loading="lazy"
      />
      {/* Dark overlay that lifts on hover */}
      <div
        className="absolute inset-0 transition-opacity duration-150"
        style={{ background: "rgba(0,0,0,0.25)" }}
      />
      {/* Specular sheen on hover */}
      <div
        className="absolute inset-0 pointer-events-none opacity-0 hover:opacity-100 transition-opacity duration-150"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.08) 0%, transparent 60%)",
        }}
      />
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────
/**
 * ViewfinderGallery — cinematic album overview shown inside the viewfinder
 * frame after the camera zoom completes, before individual photo browsing.
 *
 * Experience:
 *   1. Album title types out character-by-character
 *   2. Photo grid fades up (first 9 thumbnails, 3-column, hover tilt)
 *   3. Description (if any) types out below the grid
 *   4. "Browse Photos" CTA fades in
 *
 * Any scroll-down or clicking the CTA calls onEnter() to advance to PhotoViewer.
 */
export default function ViewfinderGallery({
  slug,
  albumTitle,
  photos,
  totalPhotos,
  description,
  onEnter,
}: ViewfinderGalleryProps) {
  const [titleText,  setTitleText]  = useState("");
  const [descText,   setDescText]   = useState("");
  const [showGrid,   setShowGrid]   = useState(false);
  const [showDesc,   setShowDesc]   = useState(false);
  const [showCTA,    setShowCTA]    = useState(false);
  const [typingDone, setTypingDone] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasEnteredRef = useRef(false);

  const enter = useCallback(() => {
    if (hasEnteredRef.current) return;
    hasEnteredRef.current = true;
    onEnter();
  }, [onEnter]);

  // ── Typewriter: title → grid → desc → CTA ──────────────────────────
  useEffect(() => {
    let i = 0;
    const titleInterval = setInterval(() => {
      i++;
      setTitleText(albumTitle.slice(0, i));
      if (i >= albumTitle.length) {
        clearInterval(titleInterval);
        setTypingDone(true);

        // Grid appears after title finishes
        setTimeout(() => setShowGrid(true), 180);

        // Description typewriter (or CTA if no description)
        setTimeout(() => {
          if (description && description.length > 0) {
            setShowDesc(true);
            let j = 0;
            const descInterval = setInterval(() => {
              j++;
              setDescText(description.slice(0, j));
              if (j >= description.length) {
                clearInterval(descInterval);
                setTimeout(() => setShowCTA(true), 200);
              }
            }, 22);
          } else {
            setShowCTA(true);
          }
        }, 500);
      }
    }, 48);

    return () => clearInterval(titleInterval);
  }, [albumTitle, description]);

  // ── Scroll / touch → enter photo viewer ────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.deltaY > 10) enter();
    };

    let touchStart: number | null = null;
    const handleTouchStart = (e: TouchEvent) => {
      touchStart = e.touches[0].clientY;
    };
    const handleTouchEnd = (e: TouchEvent) => {
      if (touchStart === null) return;
      if (touchStart - e.changedTouches[0].clientY > 30) enter();
      touchStart = null;
    };

    // Keyboard: any arrow-down / space
    const handleKey = (e: KeyboardEvent) => {
      if (["ArrowDown", "ArrowRight", " "].includes(e.key)) {
        e.preventDefault();
        enter();
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });
    window.addEventListener("keydown", handleKey);

    return () => {
      container.removeEventListener("wheel", handleWheel);
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("keydown", handleKey);
    };
  }, [enter]);

  const gridPhotos = photos.slice(0, 9);
  const cols       = gridPhotos.length >= 6 ? 3 : gridPhotos.length >= 3 ? 3 : 2;

  return (
    <div ref={containerRef} className="fixed inset-0 bg-black select-none">
      {/* Film grain */}
      <div className="film-grain-overlay viewfinder-context" aria-hidden="true" />

      <ViewfinderTunnel visible>
        {/* ── Main content area inside the viewfinder ── */}
        <div className="absolute inset-0 bg-[#050505] overflow-hidden">

          {/* Subtle radial glow at center — like looking into a lit scene */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at 50% 45%, rgba(255,255,255,0.022) 0%, transparent 65%)",
            }}
          />

          {/* Content column — vertically centered */}
          <div className="absolute inset-0 flex flex-col items-center justify-center px-4 sm:px-6 py-6 gap-0">

            {/* ── FrameCloud label ── */}
            <div
              className="mb-2"
              style={{
                opacity: 0,
                animation: "vfg-fade 0.5s ease 0.1s forwards",
              }}
            >
              <span
                className="font-mono text-[8px] sm:text-[9px] uppercase tracking-[0.3em]"
                style={{ color: "rgba(255,184,0,0.35)" }}
              >
                FrameCloud
              </span>
            </div>

            {/* ── Album title (typewriter) ── */}
            <h1
              className="font-sans text-xl sm:text-2xl font-semibold text-white text-center mb-1"
              style={{ minHeight: "1.4em", letterSpacing: "-0.01em" }}
            >
              {titleText}
              {!typingDone && (
                <span
                  className="inline-block w-[2px] h-[0.85em] bg-white/60 ml-0.5 align-middle cursor-blink"
                />
              )}
            </h1>

            {/* ── Frame count ── */}
            <div
              className="flex items-center gap-2 mb-5"
              style={{
                opacity: 0,
                animation: "vfg-fade 0.4s ease 0.3s forwards",
              }}
            >
              <div
                className="h-px w-8"
                style={{ background: "rgba(255,184,0,0.2)" }}
              />
              <span
                className="font-mono text-[8px] sm:text-[9px] uppercase tracking-[0.2em]"
                style={{ color: "rgba(255,184,0,0.4)" }}
              >
                {totalPhotos} frames
              </span>
              <div
                className="h-px w-8"
                style={{ background: "rgba(255,184,0,0.2)" }}
              />
            </div>

            {/* ── Photo grid ── */}
            {showGrid && gridPhotos.length > 0 && (
              <div
                className="w-full mb-5"
                style={{
                  maxWidth: cols === 3 ? "360px" : "240px",
                  display: "grid",
                  gridTemplateColumns: `repeat(${cols}, 1fr)`,
                  gap: "5px",
                }}
              >
                {gridPhotos.map((photo, i) => (
                  <TiltCard
                    key={photo.filename}
                    src={`/api/image/${slug}/${photo.filename}`}
                    alt={photo.caption || `Photo ${i + 1}`}
                    index={i}
                    onEnter={enter}
                  />
                ))}
              </div>
            )}

            {/* ── Description (typewriter) ── */}
            {showDesc && description && (
              <p
                className="font-mono text-[9px] sm:text-[10px] text-center leading-relaxed mb-4"
                style={{
                  color: "rgba(255,255,255,0.38)",
                  maxWidth: "280px",
                  opacity: 0,
                  animation: "vfg-fade 0.3s ease forwards",
                }}
              >
                {descText}
                {descText.length < description.length && (
                  <span className="cursor-blink inline-block w-[1.5px] h-[0.8em] bg-white/30 ml-0.5 align-middle" />
                )}
              </p>
            )}

            {/* ── CTA button ── */}
            {showCTA && (
              <button
                onClick={enter}
                className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.22em] px-5 py-2.5 rounded-sm transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
                style={{
                  color: "var(--lcd-amber)",
                  border: "1px solid rgba(255,184,0,0.28)",
                  background: "rgba(255,184,0,0.04)",
                  opacity: 0,
                  animation: "vfg-fade 0.45s ease forwards",
                  boxShadow: "0 0 20px rgba(255,184,0,0.06), inset 0 0 10px rgba(255,184,0,0.02)",
                }}
              >
                Browse Photos &rarr;
              </button>
            )}

            {/* ── Scroll hint ── */}
            <div
              className="mt-4"
              style={{
                opacity: 0,
                animation: "vfg-fade 0.4s ease 0.8s forwards",
              }}
            >
              <span
                className="font-mono text-[7px] sm:text-[8px] uppercase tracking-[0.18em]"
                style={{ color: "rgba(255,255,255,0.15)" }}
              >
                Scroll or press ↓ to enter
              </span>
            </div>
          </div>
        </div>
      </ViewfinderTunnel>
    </div>
  );
}
