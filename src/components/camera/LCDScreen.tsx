"use client";

import { useState, useEffect, useRef } from "react";
import { useAlbumAuth } from "@/hooks/useAlbumAuth";

interface LCDScreenProps {
  slug: string;
  albumTitle: string;
  totalPhotos: number;
  onAuthenticated: () => void;
}

/**
 * Authentication form styled as a camera UI overlay.
 * Positioned below the camera hero shot on the album entry page.
 * Styled with amber LCD aesthetic to match the camera's OLED display.
 */
export default function LCDScreen({
  slug,
  albumTitle,
  totalPhotos,
  onAuthenticated,
}: LCDScreenProps) {
  const [lcdActive, setLcdActive] = useState(false);
  const [password, setPassword] = useState("");
  const [showError, setShowError] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const { authenticate, loading } = useAlbumAuth(slug);
  const inputRef = useRef<HTMLInputElement>(null);
  const shakeRef = useRef<HTMLDivElement>(null);

  // LCD activation on mount
  useEffect(() => {
    const timer = setTimeout(() => setLcdActive(true), 500);
    return () => clearTimeout(timer);
  }, []);

  // Focus input when LCD activates
  useEffect(() => {
    if (lcdActive && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 600);
    }
  }, [lcdActive]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || !password) return;

    const result = await authenticate(password);

    if (result.success) {
      setAuthenticated(true);
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 25 + 10;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          setTimeout(onAuthenticated, 400);
        }
        setLoadingProgress(Math.min(progress, 100));
      }, 200);
    } else {
      setShowError(true);
      setPassword("");
      if (shakeRef.current) {
        shakeRef.current.style.animation = "none";
        shakeRef.current.offsetHeight;
        shakeRef.current.style.animation = "shake 0.4s ease-out";
      }
      setTimeout(() => setShowError(false), 500);
    }
  };

  return (
    <div
      className="w-full max-w-[400px] mx-auto transition-all duration-600"
      style={{ opacity: lcdActive ? 1 : 0 }}
    >
      {/* LCD frame — styled like camera menu interface */}
      <div
        className="relative rounded-md overflow-hidden border"
        style={{
          backgroundColor: "var(--lcd-bg)",
          borderColor: "rgba(255, 184, 0, 0.15)",
          boxShadow: "0 0 60px rgba(255, 184, 0, 0.06), inset 0 0 30px rgba(0,0,0,0.5)",
        }}
      >
        {/* Scanline overlay */}
        <div className="absolute inset-0 lcd-scanlines z-10 pointer-events-none" />
        <div className="absolute inset-0 lcd-pixel-grid z-10 pointer-events-none" />

        {/* Content */}
        <div className="relative z-20 p-6 sm:p-8">
          {!authenticated ? (
            <>
              {/* Album title */}
              <div className="text-center mb-6">
                <h2
                  className="font-mono text-xs sm:text-sm uppercase tracking-[0.15em] leading-tight"
                  style={{ color: "var(--lcd-amber)" }}
                >
                  {albumTitle}
                </h2>
                <div
                  className="w-full h-px mt-3"
                  style={{ backgroundColor: "var(--lcd-amber)", opacity: 0.2 }}
                />
              </div>

              {/* Password form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <p
                  className="font-mono text-[10px] sm:text-[11px] uppercase tracking-wider text-center"
                  style={{
                    color: showError ? "var(--accent-red)" : "var(--lcd-amber)",
                    opacity: showError ? 1 : 0.6,
                  }}
                >
                  {showError ? "ERR — INVALID CODE" : "Enter access code"}
                </p>

                <div ref={shakeRef}>
                  <input
                    ref={inputRef}
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-transparent border font-mono text-sm text-center py-2.5 px-3 outline-none uppercase tracking-wider"
                    style={{
                      borderColor: showError
                        ? "var(--accent-red)"
                        : "rgba(255, 184, 0, 0.3)",
                      color: "var(--lcd-amber)",
                      caretColor: "var(--lcd-amber)",
                    }}
                    autoComplete="off"
                    spellCheck={false}
                    disabled={loading}
                    placeholder="________________"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !password}
                  className="w-full py-2.5 font-mono text-[11px] sm:text-xs uppercase tracking-wider transition-all"
                  style={{
                    backgroundColor: password ? "var(--lcd-amber)" : "rgba(255, 184, 0, 0.1)",
                    color: password ? "#0A0A0A" : "var(--lcd-amber)",
                    border: "1px solid rgba(255, 184, 0, 0.3)",
                    opacity: loading ? 0.5 : 1,
                  }}
                >
                  {loading ? "..." : "▶ Unlock Roll"}
                </button>
              </form>

              {/* Footer info */}
              <div className="mt-6 flex items-center justify-center gap-3">
                <span
                  className="font-mono text-[9px] sm:text-[10px] uppercase tracking-wider"
                  style={{ color: "var(--lcd-amber)", opacity: 0.4 }}
                >
                  {totalPhotos} frames
                </span>
                <span style={{ color: "var(--lcd-amber)", opacity: 0.2 }}>·</span>
                <span
                  className="font-mono text-[9px] sm:text-[10px] uppercase tracking-wider"
                  style={{ color: "var(--lcd-amber)", opacity: 0.4 }}
                >
                  FrameCloud
                </span>
              </div>
            </>
          ) : (
            /* Loading state */
            <div className="text-center py-4">
              <p
                className="font-mono text-xs uppercase tracking-wider mb-4"
                style={{ color: "var(--lcd-amber)" }}
              >
                {loadingProgress >= 100
                  ? "Ready"
                  : `Loading roll... ${totalPhotos} frames`}
              </p>
              <div
                className="w-48 h-1 mx-auto overflow-hidden"
                style={{ backgroundColor: "rgba(255, 184, 0, 0.15)" }}
              >
                <div
                  className="h-full transition-all duration-200"
                  style={{
                    width: `${loadingProgress}%`,
                    backgroundColor: "var(--lcd-amber)",
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          15% { transform: translateX(-10px); }
          30% { transform: translateX(10px); }
          45% { transform: translateX(-8px); }
          60% { transform: translateX(8px); }
          75% { transform: translateX(-4px); }
          90% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  );
}
