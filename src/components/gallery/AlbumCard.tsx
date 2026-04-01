"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef } from "react";
import type { AlbumPublicMeta } from "@/lib/types";

interface AlbumCardProps {
  album: AlbumPublicMeta;
  index?: number;
  featured?: boolean;
}

export default function AlbumCard({ album, index = 0, featured = false }: AlbumCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const ruleRef = useRef<HTMLDivElement>(null);
  const shimRef = useRef<HTMLDivElement>(null);

  // ── 3D tilt + shadow ───────────────────────────────────────────────
  const handleMouseEnter = () => {
    const card = cardRef.current;
    const rule = ruleRef.current;
    if (card) {
      card.style.boxShadow = "0 24px 64px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,184,0,0.1)";
      card.style.transitionProperty = "box-shadow";
      card.style.transitionDuration = "0.3s";
    }
    if (rule) rule.style.width = "100%";
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    card.style.transition = "transform 0.08s ease-out";
    card.style.transform = `perspective(900px) rotateX(${y * -3.5}deg) rotateY(${x * 3.5}deg) scale3d(1.022,1.022,1.022)`;
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    const rule = ruleRef.current;
    if (card) {
      card.style.transition = "transform 0.6s cubic-bezier(0.23,1,0.32,1)";
      card.style.transform = "";
      card.style.boxShadow = "";
    }
    if (rule) rule.style.width = "0";
  };

  const formattedDate = new Date(album.date)
    .toLocaleDateString("en-US", { year: "numeric", month: "short" })
    .toUpperCase();

  const frameNumber = String(index + 1).padStart(2, "0") + "A";
  const sprocketCount = featured ? 8 : 5;

  return (
    <Link
      href={`/album/${album.slug}`}
      className="group block"
      aria-label={`${album.title} — ${formattedDate}, ${album.totalPhotos} frames`}
    >
      <div
        ref={cardRef}
        className="card-tilt relative"
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* ── Image frame ──────────────────────────────────────────── */}
        <div
          className="relative overflow-hidden"
          style={{
            aspectRatio: featured ? "21 / 9" : "16 / 9",
            background: "#080808",
            outline: "1px solid rgba(255,255,255,0.06)",
            outlineOffset: "-1px",
          }}
        >
          {/* Film strip header */}
          <div
            className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-2"
            style={{
              height: 22,
              background: "rgba(5,5,5,0.96)",
              borderBottom: "1px solid rgba(255,255,255,0.07)",
            }}
            aria-hidden="true"
          >
            {/* Left sprockets */}
            <div className="flex items-center gap-[5px]">
              {Array.from({ length: sprocketCount }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: 8,
                    height: 5,
                    borderRadius: 1,
                    border: "1px solid rgba(255,255,255,0.22)",
                  }}
                />
              ))}
            </div>

            {/* Center: frame number */}
            <span
              className="font-mono absolute left-1/2 -translate-x-1/2"
              style={{ fontSize: 7, letterSpacing: "0.28em", color: "rgba(255,184,0,0.55)" }}
            >
              {frameNumber}
            </span>

            {/* Right: lock + sprockets */}
            <div className="flex items-center gap-2">
              {album.isPasswordProtected && (
                <svg
                  width="8"
                  height="8"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              )}
              <div className="flex items-center gap-[5px]">
                {Array.from({ length: sprocketCount }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width: 8,
                      height: 5,
                      borderRadius: 1,
                      border: "1px solid rgba(255,255,255,0.22)",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Skeleton shimmer */}
          <div
            ref={shimRef}
            className="absolute inset-0 skeleton-shimmer transition-opacity duration-500"
          />

          {/* Cover photo */}
          <Image
            src={album.coverImage}
            alt={album.title}
            fill
            sizes={
              featured
                ? "100vw"
                : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 50vw"
            }
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
            onLoad={() => {
              if (shimRef.current) shimRef.current.style.opacity = "0";
            }}
          />

          {/* Cinematic gradient — tall, strong */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to top, rgba(0,0,0,0.93) 0%, rgba(0,0,0,0.4) 40%, rgba(0,0,0,0.08) 70%, rgba(0,0,0,0.0) 100%)",
            }}
          />

          {/* Amber inset border on hover */}
          <div
            className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-400"
            style={{ boxShadow: "inset 0 0 0 1px rgba(255,184,0,0.28)" }}
          />

          {/* Bottom info */}
          <div
            className="absolute bottom-0 left-0 right-0 z-10"
            style={{
              padding: featured ? "clamp(1rem,2.5vw,1.75rem)" : "1rem 1.125rem",
            }}
          >
            {/* Amber rule — slides in on hover */}
            <div
              ref={ruleRef}
              className="mb-3"
              style={{
                height: 1,
                width: 0,
                background: "rgba(255,184,0,0.5)",
                transition: "width 0.5s cubic-bezier(0.25,0.46,0.45,0.94)",
              }}
            />

            <h2
              className="font-sans font-semibold text-white leading-tight"
              style={{
                fontSize: featured
                  ? "clamp(1.5rem, 2.8vw, 2.5rem)"
                  : "clamp(1rem, 1.6vw, 1.25rem)",
                letterSpacing: "-0.015em",
              }}
            >
              {album.title}
            </h2>

            {album.description && (
              <p
                className="font-sans mt-1.5 line-clamp-2"
                style={{
                  fontSize: featured ? 13 : 11,
                  color: "rgba(255,255,255,0.45)",
                  lineHeight: 1.5,
                  letterSpacing: "0.005em",
                  maxWidth: "52ch",
                }}
              >
                {album.description}
              </p>
            )}

            <div className="flex items-center gap-4 mt-2">
              <span
                className="font-mono"
                style={{
                  fontSize: 9,
                  letterSpacing: "0.16em",
                  color: "rgba(255,184,0,0.6)",
                  textTransform: "uppercase",
                }}
              >
                {formattedDate}
              </span>
              <span
                className="font-mono tabular-nums"
                style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}
              >
                {album.totalPhotos} frames
              </span>
              {album.isPasswordProtected && (
                <span
                  className="font-mono"
                  style={{
                    fontSize: 8,
                    letterSpacing: "0.14em",
                    color: "rgba(255,255,255,0.22)",
                    textTransform: "uppercase",
                  }}
                >
                  Protected
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
