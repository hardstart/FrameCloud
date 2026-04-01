"use client";

import { useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import gsap from "gsap";
import CameraBack from "./CameraBack";
import ViewfinderTunnel from "@/components/viewfinder/ViewfinderTunnel";

interface CameraZoomProps {
  onZoomComplete: () => void;
  albumTitle: string;
  firstPhotoUrl?: string;
}

/**
 * Eyepiece zoom transition: the camera hero repositions so the
 * viewfinder eyepiece comes to center, then zooms IN to the eyepiece.
 * At high zoom, crossfades from the raster image to the viewfinder tunnel.
 *
 * Uses refs + RAF for 60fps scroll-driven animation (no React re-renders).
 * Reduced motion: skips animation entirely.
 */
export default function CameraZoom({ onZoomComplete, albumTitle, firstPhotoUrl }: CameraZoomProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<HTMLDivElement>(null);
  const tunnelRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const rafRef = useRef(0);
  const scrollAccRef = useRef(0);
  const completeRef = useRef(false);

  // Animation phases based on progress:
  // 0.0–0.3: Camera repositions (eyepiece moves to center)
  // 0.3–0.8: Zoom into eyepiece
  // 0.8–1.0: Crossfade to viewfinder tunnel
  const applyZoom = useCallback((progress: number) => {
    const camera = cameraRef.current;
    const tunnel = tunnelRef.current;
    const hint = hintRef.current;
    if (!camera || !tunnel) return;

    const repositionPhase = Math.min(progress / 0.3, 1);
    const zoomPhase = Math.max(0, Math.min((progress - 0.3) / 0.5, 1));
    const crossfadePhase = Math.max(0, Math.min((progress - 0.8) / 0.2, 1));

    const scale = 1 + zoomPhase * 14;

    camera.style.transform = `scale3d(${scale}, ${scale}, 1)`;
    camera.style.opacity = String(1 - crossfadePhase);
    tunnel.style.opacity = String(crossfadePhase);

    if (hint) {
      hint.style.opacity = progress < 0.05 ? "1" : "0";
    }

    // Hide LCD early in zoom
    const lcd = camera.querySelector("[data-lcd]") as HTMLElement | null;
    if (lcd) {
      lcd.style.opacity = progress < 0.15 ? "1" : "0";
    }
  }, []);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      onZoomComplete();
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    const TOTAL_SCROLL_NEEDED = 1000;

    const handleScroll = (delta: number) => {
      if (completeRef.current) return;

      scrollAccRef.current += Math.abs(delta);
      const progress = Math.min(scrollAccRef.current / TOTAL_SCROLL_NEEDED, 1);
      progressRef.current = progress;

      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(() => {
          applyZoom(progressRef.current);
          rafRef.current = 0;
        });
      }

      if (progress >= 1 && !completeRef.current) {
        completeRef.current = true;
        gsap.to(cameraRef.current, {
          opacity: 0,
          duration: 0.3,
          ease: "power2.inOut",
        });
        gsap.to(tunnelRef.current, {
          opacity: 1,
          duration: 0.3,
          ease: "power2.inOut",
          onComplete: onZoomComplete,
        });
      }
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      handleScroll(e.deltaY);
    };

    let touchStartY: number | null = null;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (touchStartY === null) return;
      const deltaY = touchStartY - e.touches[0].clientY;
      if (deltaY > 0) {
        handleScroll(deltaY * 2);
        touchStartY = e.touches[0].clientY;
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });

    return () => {
      container.removeEventListener("wheel", handleWheel);
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [onZoomComplete, applyZoom]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black flex items-center justify-center overflow-hidden"
    >
      {/* Camera hero shot — scales from the eyepiece position */}
      <div
        ref={cameraRef}
        className="relative w-[90vw] max-w-[700px]"
        style={{
          willChange: "transform, opacity",
          transformOrigin: "26% 22%",
        }}
      >
        <CameraBack showLCD={true}>
          <div data-lcd className="flex items-center justify-center h-full px-1 transition-opacity duration-200">
            <span
              className="font-mono text-[7px] sm:text-[8px] tracking-wider truncate"
              style={{ color: "var(--lcd-amber)" }}
            >
              {albumTitle}
            </span>
          </div>
        </CameraBack>
      </div>

      {/* Viewfinder tunnel — fades in during crossfade phase, with first photo preloaded */}
      <div
        ref={tunnelRef}
        className="fixed inset-0 z-20"
        style={{ opacity: 0, willChange: "opacity" }}
      >
        <ViewfinderTunnel visible={true}>
          {firstPhotoUrl ? (
            <Image
              src={firstPhotoUrl}
              alt="First photo"
              fill
              sizes="100vw"
              className="object-cover"
              priority
            />
          ) : (
            <div className="absolute inset-0 bg-black" />
          )}
        </ViewfinderTunnel>
      </div>

      {/* Scroll hint */}
      <div
        ref={hintRef}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-30 transition-opacity duration-300"
      >
        <div className="flex flex-col items-center gap-2 animate-bounce">
          <span className="font-mono text-[10px] text-white/40 uppercase tracking-wider">
            Scroll to enter viewfinder
          </span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="2"
          >
            <path d="M12 5v14M19 12l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
}
