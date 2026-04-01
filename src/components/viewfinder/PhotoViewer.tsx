"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import gsap from "gsap";
import ViewfinderTunnel from "./ViewfinderTunnel";
import ViewfinderOverlay from "./ViewfinderOverlay";
import HUD from "./HUD";
import { useHUDToggle } from "@/hooks/useHUDToggle";
import { useImagePreloader } from "@/hooks/useImagePreloader";
import type { Photo } from "@/lib/types";
import Link from "next/link";

interface PhotoViewerProps {
  slug: string;
  albumTitle: string;
  photos: Photo[];
  totalPhotos: number;
}

export default function PhotoViewer({
  slug,
  albumTitle,
  photos,
  totalPhotos,
}: PhotoViewerProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showEndScreen, setShowEndScreen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showInstruction, setShowInstruction] = useState(true);
  const { hudVisible, toggleHUD } = useHUDToggle(true);
  const isTransitioning = useRef(false);
  const touchStartY = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const shutterRef = useRef<HTMLDivElement>(null);

  const imageUrls = photos.map((p) => `/api/image/${slug}/${p.filename}`);

  useImagePreloader(imageUrls, currentIndex, 2);

  const goToPhoto = useCallback(
    (direction: "next" | "prev") => {
      if (isTransitioning.current) return;

      if (direction === "next") {
        if (showEndScreen) return;
        if (currentIndex >= totalPhotos - 1) {
          isTransitioning.current = true;
          const tl = gsap.timeline();
          tl.to(shutterRef.current, { opacity: 1, duration: 0.08, ease: "power2.in" });
          tl.call(() => setShowEndScreen(true));
          tl.to(shutterRef.current, {
            opacity: 0,
            duration: 0.1,
            ease: "power2.out",
            onComplete: () => { isTransitioning.current = false; },
          });
          return;
        }
      } else {
        if (showEndScreen) {
          isTransitioning.current = true;
          const tl = gsap.timeline();
          tl.to(shutterRef.current, { opacity: 1, duration: 0.08, ease: "power2.in" });
          tl.call(() => setShowEndScreen(false));
          tl.to(shutterRef.current, {
            opacity: 0,
            duration: 0.1,
            ease: "power2.out",
            onComplete: () => { isTransitioning.current = false; },
          });
          return;
        }
        if (currentIndex <= 0) return;
      }

      isTransitioning.current = true;
      const tl = gsap.timeline();

      // Shutter close
      tl.to(shutterRef.current, { opacity: 1, duration: 0.08, ease: "power2.in" });

      // Swap photo at peak of shutter
      tl.call(() => {
        setCurrentIndex((prev) => (direction === "next" ? prev + 1 : prev - 1));
        setImageLoaded(false);
      });

      // Shutter open
      tl.to(shutterRef.current, {
        opacity: 0,
        duration: 0.06,
        ease: "power2.out",
        delay: 0.02,
        onComplete: () => { isTransitioning.current = false; },
      });
    },
    [currentIndex, totalPhotos, showEndScreen]
  );

  // Scroll wheel handler
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let scrollAccumulator = 0;
    const SCROLL_THRESHOLD = 50;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      scrollAccumulator += e.deltaY;

      if (Math.abs(scrollAccumulator) >= SCROLL_THRESHOLD) {
        goToPhoto(scrollAccumulator > 0 ? "next" : "prev");
        scrollAccumulator = 0;
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [goToPhoto]);

  // Touch handlers
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (touchStartY.current === null) return;
      const deltaY = touchStartY.current - e.changedTouches[0].clientY;
      if (Math.abs(deltaY) >= 50) {
        goToPhoto(deltaY > 0 ? "next" : "prev");
      }
      touchStartY.current = null;
    };

    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [goToPhoto]);

  // Keyboard handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
        case "ArrowRight":
        case " ":
          e.preventDefault();
          goToPhoto("next");
          break;
        case "ArrowUp":
        case "ArrowLeft":
          e.preventDefault();
          goToPhoto("prev");
          break;
        case "i":
          toggleHUD();
          break;
        case "Escape":
          router.push("/");
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToPhoto, toggleHUD, router]);

  // Hide instruction on first interaction
  useEffect(() => {
    if (!showInstruction) return;
    const hide = () => setShowInstruction(false);
    const timer = setTimeout(hide, 5000);
    window.addEventListener("wheel", hide, { once: true });
    window.addEventListener("touchstart", hide, { once: true });
    window.addEventListener("keydown", hide, { once: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener("wheel", hide);
      window.removeEventListener("touchstart", hide);
      window.removeEventListener("keydown", hide);
    };
  }, [showInstruction]);

  const currentPhoto = photos[currentIndex];

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black select-none overflow-hidden"
      role="region"
      aria-label={`Photo viewer: ${albumTitle}`}
      aria-live="polite"
    >
      {/* Viewfinder tunnel — the physical eyepiece housing */}
      <ViewfinderTunnel visible={true}>
        {/* Photo inside the viewfinder opening */}
        {!showEndScreen && (
          <div
            className="absolute inset-0"
            style={{ willChange: "opacity" }}
            onClick={toggleHUD}
          >
            <Image
              key={currentIndex}
              src={imageUrls[currentIndex]}
              alt={currentPhoto?.caption || `Photo ${currentIndex + 1} of ${totalPhotos}`}
              fill
              sizes="100vw"
              className="object-cover transition-opacity duration-300"
              style={{ opacity: imageLoaded ? 1 : 0 }}
              onLoad={() => setImageLoaded(true)}
              draggable={false}
              priority={currentIndex === 0}
            />
          </div>
        )}

        {/* End of Roll screen */}
        {showEndScreen && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black">
            <div className="text-center">
              <p className="font-mono text-base sm:text-lg text-white/80 uppercase tracking-[0.2em] mb-5">
                End of Roll
              </p>
              <div className="w-12 h-px bg-white/20 mx-auto mb-5" />
              <p className="font-mono text-[10px] sm:text-xs text-white/50 uppercase tracking-wider mb-1">
                {albumTitle}
              </p>
              <p className="font-mono text-[10px] sm:text-xs text-white/40 uppercase tracking-wider mb-6">
                {totalPhotos} frames
              </p>
              <Link
                href="/"
                className="font-mono text-[10px] sm:text-xs text-white/60 uppercase tracking-wider hover:text-white transition-colors"
              >
                &larr; Back to Gallery
              </Link>
            </div>
          </div>
        )}

        {/* Frame lines and focus brackets */}
        <ViewfinderOverlay visible={hudVisible && !showEndScreen} />

        {/* HUD — album info, shot counter, exposure data bar */}
        {!showEndScreen && (
          <HUD
            albumTitle={albumTitle}
            currentIndex={currentIndex}
            totalPhotos={totalPhotos}
            caption={currentPhoto?.caption}
            dateTaken={currentPhoto?.dateTaken}
            visible={hudVisible}
          />
        )}

        {/* Shutter blink — controlled via GSAP ref */}
        <div
          ref={shutterRef}
          className="absolute inset-0 z-40 bg-black pointer-events-none"
          style={{ opacity: 0 }}
        />
      </ViewfinderTunnel>

      {/* Info toggle hint */}
      <div
        className="fixed bottom-4 right-4 z-50 pointer-events-none font-mono text-[10px] text-white transition-opacity duration-300"
        style={{ opacity: hudVisible ? 0 : 0.2 }}
      >
        i
      </div>

      {/* First visit instruction overlay */}
      {showInstruction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 pointer-events-none">
          <div className="text-center">
            <p className="font-mono text-[11px] sm:text-xs text-white/70 uppercase tracking-wider mb-2">
              Scroll to shoot through the roll
            </p>
            <p className="font-mono text-[9px] sm:text-[10px] text-white/40 uppercase tracking-wider">
              Tap to toggle info
            </p>
          </div>
        </div>
      )}

      {/* Screen reader announcements */}
      <div className="sr-only" aria-live="assertive">
        {showEndScreen
          ? "End of roll"
          : `Photo ${currentIndex + 1} of ${totalPhotos}: ${currentPhoto?.caption || ""}`}
      </div>
    </div>
  );
}
