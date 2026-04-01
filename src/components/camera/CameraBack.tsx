"use client";

import Image from "next/image";
import { ReactNode } from "react";

interface CameraBackProps {
  children?: ReactNode;
  className?: string;
  showLCD?: boolean;
}

/**
 * Camera hero shot component — back view of a premium mirrorless camera.
 * Uses a photorealistic hero image with an overlay area for the
 * LCD status display (where the password UI lives).
 *
 * Enhanced LCD: recording indicator, mode readout, battery bar,
 * denser scanlines, and pixel-grid texture for the Nikon Z9 look.
 */
export default function CameraBack({
  children,
  className = "",
  showLCD = true,
}: CameraBackProps) {
  return (
    <div className={`relative ${className}`}>
      <div className="relative w-full max-w-[700px] mx-auto">
        <div className="relative aspect-[1.757/1] overflow-hidden">
          {/* Photorealistic camera hero image */}
          <Image
            src="/assets/camera-hero.png"
            alt="Premium mirrorless camera"
            fill
            priority
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 700px"
          />

          {/* LCD overlay area — positioned over the camera's back door panel */}
          {showLCD && (
            <div className="absolute top-[24%] left-[16%] w-[68%] h-[62%]">
              <div className="relative w-full h-full rounded-[2px] overflow-hidden bg-[#0d0d08]">

                {/* Top status bar — mode + recording indicator */}
                <div
                  className="absolute top-0 left-0 right-0 flex items-center justify-between px-[6%] pt-[4%]"
                  style={{ zIndex: 2 }}
                >
                  {/* Recording dot */}
                  <div className="flex items-center gap-1">
                    <div
                      className="rounded-full"
                      style={{
                        width: 4,
                        height: 4,
                        background: "var(--accent-red)",
                        boxShadow: "0 0 4px rgba(255,0,0,0.6)",
                        animation: "blink 1.2s step-end infinite",
                      }}
                    />
                    <span
                      className="font-mono text-[5px] sm:text-[6px] uppercase tracking-wider"
                      style={{ color: "rgba(255,184,0,0.55)" }}
                    >
                      STI
                    </span>
                  </div>

                  {/* Shooting mode */}
                  <span
                    className="font-mono text-[5px] sm:text-[6px] uppercase tracking-widest"
                    style={{ color: "rgba(255,184,0,0.7)" }}
                  >
                    A
                  </span>

                  {/* Battery indicator */}
                  <div className="flex items-center gap-0.5">
                    <div
                      className="relative rounded-[1px] overflow-hidden"
                      style={{
                        width: 10,
                        height: 5,
                        border: "0.5px solid rgba(255,184,0,0.4)",
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          inset: 1,
                          width: "65%",
                          background: "rgba(255,184,0,0.6)",
                          borderRadius: 1,
                        }}
                      />
                    </div>
                    {/* Battery nub */}
                    <div
                      style={{
                        width: 1.5,
                        height: 3,
                        background: "rgba(255,184,0,0.4)",
                        borderRadius: "0 1px 1px 0",
                      }}
                    />
                  </div>
                </div>

                {/* Main content slot */}
                <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 1 }}>
                  {children ? (
                    children
                  ) : (
                    <div className="flex flex-col items-center gap-0.5 px-2">
                      <span
                        className="font-mono text-[8px] sm:text-[9px] tracking-wider"
                        style={{ color: "var(--lcd-amber)" }}
                      >
                        f/5.6 · 1/60 · ISO 124
                      </span>
                      <span
                        className="font-mono text-[5px] sm:text-[6px] tracking-widest"
                        style={{ color: "rgba(255,184,0,0.45)" }}
                      >
                        RAW+FINE
                      </span>
                    </div>
                  )}
                </div>

                {/* Bottom status bar — shot counter */}
                <div
                  className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-[6%] pb-[4%]"
                  style={{ zIndex: 2 }}
                >
                  <span
                    className="font-mono text-[5px] sm:text-[6px] tracking-widest"
                    style={{ color: "rgba(255,184,0,0.45)" }}
                  >
                    Z9
                  </span>
                  <span
                    className="font-mono text-[5px] sm:text-[6px] tracking-widest tabular-nums"
                    style={{ color: "rgba(255,184,0,0.55)" }}
                  >
                    ●●● 264
                  </span>
                </div>

                {/* Scanlines */}
                <div className="absolute inset-0 lcd-scanlines pointer-events-none" style={{ zIndex: 3 }} />
                {/* Pixel grid */}
                <div className="absolute inset-0 lcd-pixel-grid pointer-events-none" style={{ zIndex: 3 }} />
                {/* Inner vignette — authentic LCD edge darkening */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    zIndex: 4,
                    background:
                      "radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0,0.35) 100%)",
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
