"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import ViewfinderOverlay from "@/components/viewfinder/ViewfinderOverlay";
import HUD from "@/components/viewfinder/HUD";
import { useImagePreloader } from "@/hooks/useImagePreloader";
import { useHUDToggle } from "@/hooks/useHUDToggle";
import type { Photo } from "@/lib/types";

interface CameraScrollExperienceProps {
  albumTitle: string;
  photos: Photo[];
  totalPhotos: number;
  slug: string;
}

// ─── Web Audio synth helpers ──────────────────────────────────────────

function createAudioCtx(): AudioContext | null {
  try {
    return new (
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    )();
  } catch {
    return null;
  }
}

function playZoomWhoosh(ctx: AudioContext) {
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(840, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.7);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.11, ctx.currentTime + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.75);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.8);
  } catch { /* noop */ }
}

function playAfBeep(ctx: AudioContext) {
  try {
    [0, 0.13].forEach((delay) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = 2800;
      gain.gain.setValueAtTime(0.065, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.09);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.12);
    });
  } catch { /* noop */ }
}

function playShutterClick(ctx: AudioContext) {
  try {
    const bufLen = Math.floor(ctx.sampleRate * 0.06);
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufLen * 0.08));
    }
    const src = ctx.createBufferSource();
    const gain = ctx.createGain();
    src.buffer = buf;
    src.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.value = 0.32;
    src.start(ctx.currentTime);
  } catch { /* noop */ }
}

// ─── Component ────────────────────────────────────────────────────────

/**
 * Two-phase viewfinder experience:
 *
 * Phase 1 — SCRUB: The Higgsfield camera-zoom video scrubs on scroll
 * (GSAP ScrollTrigger), zooming cinematically into the eyepiece.
 * AF brackets, iris vignette, exposure counters, and sounds play
 * during the zoom.
 *
 * Phase 2 — BROWSE: When the scrub completes, photos appear in-place
 * inside the same viewfinder frame. No separate component, no crossfade
 * tunnel — the video's last frame IS the viewfinder, and photos just
 * swap in behind the EVF overlays (ViewfinderOverlay + HUD).
 * Scroll/swipe/keyboard navigates between frames.
 */
export default function CameraScrollExperience({
  albumTitle,
  photos,
  totalPhotos,
  slug,
}: CameraScrollExperienceProps) {
  // ── Browse phase state ─────────────────────────────────────────────
  const [browsing, setBrowsing]       = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showEndScreen, setShowEndScreen] = useState(false);
  const [imageLoaded, setImageLoaded]   = useState(false);
  const { hudVisible, toggleHUD }       = useHUDToggle(true);

  // ── Scrub phase refs ───────────────────────────────────────────────
  const scrollWrapperRef = useRef<HTMLDivElement>(null);
  const videoRef         = useRef<HTMLVideoElement>(null);
  const vignetteRef      = useRef<HTMLDivElement>(null);
  const hintRef          = useRef<HTMLDivElement>(null);
  const exposureRef      = useRef<HTMLDivElement>(null);
  const fStopRef         = useRef<HTMLSpanElement>(null);
  const shutterRef       = useRef<HTMLSpanElement>(null);
  const isoRef           = useRef<HTMLSpanElement>(null);
  const afStatusRef      = useRef<HTMLDivElement>(null);
  const afBracketsRef    = useRef<HTMLDivElement>(null);
  const lensFlareRef     = useRef<HTMLDivElement>(null);

  // ── Browse phase refs ──────────────────────────────────────────────
  const shutterBlinkRef     = useRef<HTMLDivElement>(null);
  const isTransitioningRef  = useRef(false);
  const touchStartBrowseRef = useRef<number | null>(null);
  const scrollAccBrowseRef  = useRef(0);

  // ── Shared refs ────────────────────────────────────────────────────
  const completeRef        = useRef(false);
  const sound25Fired       = useRef(false);
  const sound60Fired       = useRef(false);
  const sound72Fired       = useRef(false);
  const audioCtxRef        = useRef<AudioContext | null>(null);
  const returnToScrubRef   = useRef(false);

  const imageUrls = photos.map((p) => `/api/image/${slug}/${p.filename}`);
  useImagePreloader(imageUrls, currentIndex, 2);

  // ── Body scroll lock when browsing ────────────────────────────────
  useEffect(() => {
    if (!browsing) return;
    document.body.style.overflow = "hidden";
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    return () => { document.body.style.overflow = ""; };
  }, [browsing]);

  // ── Photo navigation ───────────────────────────────────────────────
  const goToPhoto = useCallback(
    (direction: "next" | "prev") => {
      if (isTransitioningRef.current) return;

      const blink = shutterBlinkRef.current;

      if (direction === "next") {
        if (showEndScreen) return;
        if (currentIndex >= totalPhotos - 1) {
          isTransitioningRef.current = true;
          const tl = gsap.timeline();
          tl.to(blink, { opacity: 1, duration: 0.08, ease: "power2.in" });
          tl.call(() => setShowEndScreen(true));
          tl.to(blink, { opacity: 0, duration: 0.10, ease: "power2.out",
            onComplete: () => { isTransitioningRef.current = false; } });
          return;
        }
      } else {
        if (showEndScreen) {
          isTransitioningRef.current = true;
          const tl = gsap.timeline();
          tl.to(blink, { opacity: 1, duration: 0.08, ease: "power2.in" });
          tl.call(() => setShowEndScreen(false));
          tl.to(blink, { opacity: 0, duration: 0.10, ease: "power2.out",
            onComplete: () => { isTransitioningRef.current = false; } });
          return;
        }
        if (currentIndex <= 0) {
          // Scroll back past first photo → return to camera scrub
          isTransitioningRef.current = true;
          returnToScrubRef.current = true;
          // Keep completeRef true so ScrollTrigger at p≈1.0 won't re-enter browse
          completeRef.current = true;
          sound25Fired.current = true;
          sound60Fired.current = true;
          sound72Fired.current = true;
          setCurrentIndex(0);
          setImageLoaded(false);
          setBrowsing(false);
          return;
        }
      }

      isTransitioningRef.current = true;
      const tl = gsap.timeline();
      tl.to(blink, { opacity: 1, duration: 0.08, ease: "power2.in" });
      tl.call(() => {
        setCurrentIndex((prev) => direction === "next" ? prev + 1 : prev - 1);
        setImageLoaded(false);
      });
      tl.to(blink, { opacity: 0, duration: 0.06, ease: "power2.out", delay: 0.02,
        onComplete: () => { isTransitioningRef.current = false; } });
    },
    [currentIndex, totalPhotos, showEndScreen]
  );

  // ── Browse scroll / touch / keyboard ─────────────────────────────
  useEffect(() => {
    if (!browsing) return;

    const THRESHOLD = 50;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      scrollAccBrowseRef.current += e.deltaY;
      if (Math.abs(scrollAccBrowseRef.current) >= THRESHOLD) {
        goToPhoto(scrollAccBrowseRef.current > 0 ? "next" : "prev");
        scrollAccBrowseRef.current = 0;
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      touchStartBrowseRef.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (touchStartBrowseRef.current === null) return;
      const delta = touchStartBrowseRef.current - e.changedTouches[0].clientY;
      if (Math.abs(delta) >= THRESHOLD) {
        goToPhoto(delta > 0 ? "next" : "prev");
      }
      touchStartBrowseRef.current = null;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown": case "ArrowRight": case " ":
          e.preventDefault(); goToPhoto("next"); break;
        case "ArrowUp": case "ArrowLeft":
          e.preventDefault(); goToPhoto("prev"); break;
        case "i": toggleHUD(); break;
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [browsing, goToPhoto, toggleHUD]);

  // ── GSAP scrub — only runs while in scrub phase ────────────────────
  // When `browsing` flips to true the effect re-runs, hits the early
  // return, and the *previous* run's cleanup reverts the GSAP context
  // and kills ScrollTrigger.
  useEffect(() => {
    if (browsing) return;

    const prefersReducedMotion =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      setBrowsing(true);
      return;
    }

    let mounted = true;
    let cleanup: (() => void) | undefined;

    const init = async () => {
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      if (!mounted) return;
      gsap.registerPlugin(ScrollTrigger);

      const wrapper    = scrollWrapperRef.current;
      const video      = videoRef.current;
      const vignette   = vignetteRef.current;
      const hint       = hintRef.current;
      const exposure   = exposureRef.current;
      const afBrackets = afBracketsRef.current;
      const lensFlare  = lensFlareRef.current;

      if (!wrapper) return;

      // ── Returning from browse → start at bottom (video last frame)
      const isReturning = returnToScrubRef.current;
      if (isReturning) {
        returnToScrubRef.current = false;
        window.scrollTo({ top: wrapper.scrollHeight, behavior: "instant" as ScrollBehavior });
        isTransitioningRef.current = false;
      }

      // ── Initial states ──────────────────────────────────────────
      if (video)      video.style.opacity = "1";
      if (!isReturning) {
        if (vignette)   gsap.set(vignette,   { opacity: 0 });
        if (exposure)   gsap.set(exposure,   { opacity: 0 });
        if (afBrackets) gsap.set(afBrackets, { opacity: 0, width: 180, height: 180 });
        if (lensFlare)  gsap.set(lensFlare,  { opacity: 0, scale: 0.5 });
      }

      const ctx = gsap.context(() => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: wrapper,
            start:   "top top",
            end:     "bottom bottom",
            scrub:   1.2,
            onUpdate: (self) => {
              const p = self.progress;

              // ── Video scrub ───────────────────────────────────
              if (video && video.duration > 0) {
                video.currentTime = Math.min(p / 0.90, 1) * video.duration;
              }

              // ── Iris mask ─────────────────────────────────────
              if (vignette) {
                const vigT    = Math.max(0, Math.min(1, (p - 0.40) / 0.50));
                const hole    = Math.max(5, 68 - vigT * 63);
                const feather = Math.max(2, hole - 15);
                const mask    = `radial-gradient(circle at 46% 37%, transparent ${feather}%, black ${hole}%)`;
                vignette.style.maskImage = mask;
                (vignette.style as CSSStyleDeclaration & { webkitMaskImage: string }).webkitMaskImage = mask;
              }

              // ── AF bracket colour ─────────────────────────────
              if (afBrackets) {
                const locked = p > 0.58;
                const colour = locked ? "rgba(100,255,100,0.9)" : "rgba(255,184,0,0.8)";
                afBrackets
                  .querySelectorAll<HTMLDivElement>(".af-corner")
                  .forEach((el) => (el.style.borderColor = colour));
                const dot = afBrackets.querySelector<HTMLDivElement>(".af-dot");
                if (dot) dot.style.background = locked
                  ? "rgba(100,255,100,0.8)"
                  : "rgba(255,184,0,0.6)";
              }

              // ── Exposure counters ─────────────────────────────
              if (fStopRef.current)
                fStopRef.current.textContent = (1.2 + p * 2.4).toFixed(1);
              if (shutterRef.current)
                shutterRef.current.textContent = String(Math.round(60 + p * 440));
              if (isoRef.current)
                isoRef.current.textContent = String(Math.round(100 + p * 300));

              // ── AF status text ────────────────────────────────
              const afStatus = afStatusRef.current;
              if (afStatus) {
                if (p < 0.30) {
                  afStatus.textContent = "FOCUSING";
                  afStatus.style.color = "rgba(255,184,0,0.55)";
                } else if (p < 0.58) {
                  afStatus.textContent = "FOCUSING ●";
                  afStatus.style.color = "rgba(255,184,0,0.85)";
                } else if (p < 0.72) {
                  afStatus.textContent = "AF LOCK ●";
                  afStatus.style.color = "rgba(100,255,100,0.9)";
                } else {
                  afStatus.textContent = "● AF ●";
                  afStatus.style.color = "rgba(100,255,100,1.0)";
                }
              }

              // ── Sound triggers ────────────────────────────────
              if (p > 0.25 && !sound25Fired.current) {
                sound25Fired.current = true;
                if (!audioCtxRef.current) audioCtxRef.current = createAudioCtx();
                if (audioCtxRef.current) playZoomWhoosh(audioCtxRef.current);
              }
              if (p > 0.60 && !sound60Fired.current) {
                sound60Fired.current = true;
                if (!audioCtxRef.current) audioCtxRef.current = createAudioCtx();
                if (audioCtxRef.current) playAfBeep(audioCtxRef.current);
              }
              if (p > 0.72 && !sound72Fired.current) {
                sound72Fired.current = true;
                if (!audioCtxRef.current) audioCtxRef.current = createAudioCtx();
                if (audioCtxRef.current) playShutterClick(audioCtxRef.current);
              }

              // ── Reset complete flag when scrolling back up ────
              if (p < 0.95 && completeRef.current) {
                completeRef.current = false;
              }

              // ── Enter browse phase ────────────────────────────
              if (p >= 0.99 && !completeRef.current) {
                completeRef.current = true;
                setBrowsing(true);
              }
            },
          },
        });

        // Vignette fade-in
        if (vignette)
          tl.to(vignette, { opacity: 1, duration: 0.50, ease: "power1.in" }, 0.40);

        // AF bracket animation
        if (afBrackets) {
          tl.to(afBrackets, { opacity: 0.85, duration: 0.10, ease: "power1.out"  }, 0.10);
          tl.to(afBrackets, { width: 90, height: 90, duration: 0.30, ease: "power2.inOut" }, 0.20);
          tl.to(afBrackets, { width: 36, height: 36, duration: 0.15, ease: "power3.out"   }, 0.50);
          tl.to(afBrackets, { width: 46, height: 46, duration: 0.04, ease: "power1.out"   }, 0.65);
          tl.to(afBrackets, { width: 38, height: 38, duration: 0.05, ease: "power2.in"    }, 0.69);
          tl.to(afBrackets, { opacity: 0, duration: 0.10, ease: "power1.in"               }, 0.78);
        }

        // Lens flare flash
        if (lensFlare) {
          tl.to(lensFlare, { opacity: 0.55, scale: 1.3, duration: 0.04, ease: "power2.out" }, 0.35);
          tl.to(lensFlare, { opacity: 0,    scale: 0.7, duration: 0.08, ease: "power2.in"  }, 0.39);
        }

        // Exposure fade-in
        if (exposure)
          tl.to(exposure, { opacity: 1, duration: 0.13, ease: "power1.in" }, 0.22);

        // Hint fade-out
        if (hint)
          tl.to(hint, { opacity: 0, duration: 0.04, ease: "none" }, 0.03);

        // Video runs to its last frame — that IS the viewfinder.
        // No tunnel crossfade: browse phase overlays the photos directly.
      }, wrapper);

      cleanup = () => ctx.revert();
    };

    init();

    return () => {
      mounted = false;
      cleanup?.();
    };
  }, [browsing]); // `browsing` dep: when it flips true, cleanup reverts GSAP

  const currentPhoto = photos[currentIndex];

  // ─────────────────────────────────────────────────────────────────
  // PHASE 2 — BROWSE
  // Photos render full-screen behind EVF overlays. The video's last
  // frame established the viewfinder frame; this continues seamlessly.
  // ─────────────────────────────────────────────────────────────────
  if (browsing) {
    return (
      <div
        className="fixed inset-0 bg-black overflow-hidden select-none"
        onClick={toggleHUD}
        role="region"
        aria-label={`Photo viewer: ${albumTitle}`}
      >
        {/* Film grain */}
        <div className="film-grain-overlay" aria-hidden="true" />

        {/* Current photo — full-screen, fades in as it loads */}
        {!showEndScreen && (
          <div className="absolute inset-0">
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

        {/* End of Roll */}
        {showEndScreen && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black">
            <p className="font-mono text-base sm:text-lg text-white/80 uppercase tracking-[0.2em] mb-5">
              End of Roll
            </p>
            <div className="w-12 h-px bg-white/20 mb-5" />
            <p className="font-mono text-[10px] sm:text-xs text-white/50 uppercase tracking-wider mb-1">
              {albumTitle}
            </p>
            <p className="font-mono text-[10px] sm:text-xs text-white/40 uppercase tracking-wider mb-6">
              {totalPhotos} frames
            </p>
            <Link
              href="/"
              className="font-mono text-[10px] sm:text-xs text-white/60 uppercase tracking-wider hover:text-white transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              &larr; Back to Gallery
            </Link>
          </div>
        )}

        {/* EVF frame lines + AF brackets */}
        <ViewfinderOverlay visible={hudVisible && !showEndScreen} />

        {/* Album info bar + exposure data */}
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

        {/* Shutter blink — GSAP-driven, covers everything momentarily */}
        <div
          ref={shutterBlinkRef}
          className="absolute inset-0 z-40 bg-black pointer-events-none"
          style={{ opacity: 0 }}
        />

        {/* HUD toggle hint */}
        <div
          className="fixed bottom-4 right-4 z-50 pointer-events-none font-mono text-[10px] text-white transition-opacity duration-300"
          style={{ opacity: hudVisible ? 0 : 0.2 }}
        >
          i
        </div>

        {/* Screen reader announcements */}
        <div className="sr-only" aria-live="assertive">
          {showEndScreen
            ? "End of roll"
            : `Photo ${currentIndex + 1} of ${totalPhotos}: ${currentPhoto?.caption || ""}`}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // PHASE 1 — SCRUB
  // Scrollable wrapper gives GSAP ScrollTrigger its scroll distance.
  // Sticky inner div keeps the scene fixed during scroll.
  // ─────────────────────────────────────────────────────────────────
  return (
    <div
      ref={scrollWrapperRef}
      style={{ height: "calc(100vh + 1200px)", position: "relative" }}
    >
      <div className="sticky top-0 h-screen overflow-hidden bg-black flex items-center justify-center">

        {/* Film grain */}
        <div className="film-grain-overlay" aria-hidden="true" />

        {/* Camera zoom video — scroll scrubs currentTime */}
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          ref={videoRef}
          src="/assets/camera-zoom.mp4"
          preload="auto"
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{ willChange: "opacity" }}
        />

        {/* Iris vignette — radial mask that closes on eyepiece */}
        <div
          ref={vignetteRef}
          className="fixed inset-0 pointer-events-none"
          aria-hidden="true"
          style={{
            zIndex: 10,
            opacity: 0,
            background: "black",
            willChange: "opacity, mask-image",
            maskImage:
              "radial-gradient(circle at 46% 37%, transparent 68%, black 70%)",
            WebkitMaskImage:
              "radial-gradient(circle at 46% 37%, transparent 68%, black 70%)",
          } as React.CSSProperties}
        />

        {/* EVF scanlines */}
        <div
          className="fixed inset-0 pointer-events-none evf-scanlines"
          aria-hidden="true"
          style={{ zIndex: 11, opacity: 0.035 }}
        />

        {/* Lens flare */}
        <div
          ref={lensFlareRef}
          className="fixed pointer-events-none"
          aria-hidden="true"
          style={{
            zIndex: 15, left: "46%", top: "37%",
            transform: "translate(-50%, -50%)",
            width: 90, height: 90, borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(255,240,200,0.95) 0%, rgba(255,184,0,0.4) 40%, transparent 70%)",
            opacity: 0,
            willChange: "opacity, transform",
          }}
        />

        {/* Animated exposure data */}
        <div
          ref={exposureRef}
          className="fixed pointer-events-none"
          style={{ zIndex: 20, bottom: "13%", left: "50%",
            transform: "translateX(-50%)", opacity: 0, willChange: "opacity" }}
        >
          <div className="flex items-end gap-6 sm:gap-8">
            <div className="flex flex-col items-center gap-0.5 evf-data">
              <span className="font-mono text-[7px] sm:text-[8px] uppercase tracking-widest"
                style={{ color: "rgba(255,184,0,0.45)" }}>f/</span>
              <span ref={fStopRef} className="font-mono text-[11px] sm:text-xs tabular-nums"
                style={{ color: "var(--lcd-amber)", textShadow: "0 0 8px rgba(255,184,0,0.35)" }}>1.2</span>
            </div>
            <div className="flex flex-col items-center gap-0.5 evf-data" style={{ animationDelay: "0.3s" }}>
              <span className="font-mono text-[7px] sm:text-[8px] uppercase tracking-widest"
                style={{ color: "rgba(255,184,0,0.45)" }}>1/</span>
              <span ref={shutterRef} className="font-mono text-[11px] sm:text-xs tabular-nums"
                style={{ color: "var(--lcd-amber)", textShadow: "0 0 8px rgba(255,184,0,0.35)" }}>60</span>
            </div>
            <div className="flex flex-col items-center gap-0.5 evf-data" style={{ animationDelay: "0.6s" }}>
              <span className="font-mono text-[7px] sm:text-[8px] uppercase tracking-widest"
                style={{ color: "rgba(255,184,0,0.45)" }}>ISO</span>
              <span ref={isoRef} className="font-mono text-[11px] sm:text-xs tabular-nums"
                style={{ color: "var(--lcd-amber)", textShadow: "0 0 8px rgba(255,184,0,0.35)" }}>100</span>
            </div>
          </div>
          <div className="w-full h-px mt-2.5"
            style={{ background: "linear-gradient(90deg, transparent, rgba(255,184,0,0.25) 30%, rgba(255,184,0,0.25) 70%, transparent)" }} />
        </div>

        {/* AF status */}
        <div
          ref={afStatusRef}
          className="fixed pointer-events-none font-mono text-[8px] sm:text-[9px] uppercase tracking-[0.25em]"
          style={{ zIndex: 20, bottom: "8%", left: "50%",
            transform: "translateX(-50%)", color: "rgba(255,184,0,0.55)" }}
          aria-hidden="true"
        >
          FOCUSING
        </div>

        {/* Album title */}
        <div className="fixed top-6 left-1/2 -translate-x-1/2 pointer-events-none" style={{ zIndex: 10 }}>
          <span
            className="font-mono text-[10px] sm:text-xs uppercase tracking-[0.2em]"
            style={{ color: "var(--lcd-amber)", textShadow: "0 0 10px rgba(255,184,0,0.3)" }}
          >
            {albumTitle}
          </span>
        </div>

        {/* Scroll hint */}
        <div
          ref={hintRef}
          className="fixed bottom-8 left-1/2 -translate-x-1/2"
          style={{ zIndex: 40, transition: "opacity 0.4s ease" }}
        >
          <div className="flex flex-col items-center gap-2 animate-bounce">
            <span className="font-mono text-[10px] text-white/40 uppercase tracking-wider">
              Scroll to enter viewfinder
            </span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="rgba(255,255,255,0.3)" strokeWidth="2" aria-hidden="true">
              <path d="M12 5v14M19 12l-7 7-7-7" />
            </svg>
          </div>
        </div>

      </div>
    </div>
  );
}
