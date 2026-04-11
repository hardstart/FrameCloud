'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import type { FrameState } from './useDarkroom';

interface PhotoRevealProps {
  frame: FrameState | null;
  onDismiss: () => void;
}

export function PhotoReveal({ frame, onDismiss }: PhotoRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!frame || !containerRef.current || !imgRef.current) return;

    const tl = gsap.timeline();

    tl.fromTo(containerRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.4, ease: 'power2.out' },
    );

    tl.fromTo(imgRef.current,
      { scale: 0.3, y: 40, opacity: 0 },
      { scale: 1, y: 0, opacity: 1, duration: 0.5, ease: 'power3.out' },
      '<0.1',
    );

    return () => { tl.kill(); };
  }, [frame]);

  if (!frame) return null;

  const handleDismiss = () => {
    if (!containerRef.current || !imgRef.current) {
      onDismiss();
      return;
    }

    const tl = gsap.timeline({ onComplete: onDismiss });
    tl.to(imgRef.current, { scale: 0.3, y: 40, opacity: 0, duration: 0.35, ease: 'power2.in' })
      .to(containerRef.current, { opacity: 0, duration: 0.3, ease: 'power2.in' }, '<0.05');
  };

  return (
    <div
      ref={containerRef}
      onClick={handleDismiss}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(4, 2, 1, 0.92)',
        cursor: 'pointer',
        padding: 20,
      }}
    >
      {/* Photo with white gallery border */}
      <div
        ref={imgRef}
        style={{
          width: '100%',
          maxWidth: 420,
          position: 'relative',
          background: '#f5f2ed',
          padding: '28px 24px 40px',
          boxShadow: `
            0 1px 0 rgba(255, 255, 255, 0.06),
            0 8px 60px rgba(0, 0, 0, 0.5),
            0 2px 20px rgba(0, 0, 0, 0.3)
          `,
        }}
      >
        {/* Inner photo */}
        <div style={{
          width: '100%',
          aspectRatio: '3 / 4',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={frame.photoUrl}
            alt={frame.subject}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />

          {/* Subtle wet print sheen */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(155deg,
              rgba(255, 250, 240, 0.07) 0%,
              transparent 25%,
              rgba(255, 250, 240, 0.04) 55%,
              transparent 80%)`,
            pointerEvents: 'none',
          }} />
        </div>

        {/* Paper texture */}
        <div style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.03,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='p'%3E%3CfeTurbulence baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23p)'/%3E%3C/svg%3E")`,
          backgroundSize: '100px',
          pointerEvents: 'none',
        }} />

        {/* Thin inner shadow */}
        <div style={{
          position: 'absolute',
          top: 28,
          left: 24,
          right: 24,
          bottom: 40,
          boxShadow: 'inset 0 0 3px rgba(0, 0, 0, 0.12)',
          pointerEvents: 'none',
        }} />
      </div>

      {/* Subject caption */}
      <div style={{
        position: 'absolute',
        bottom: 'max(32px, env(safe-area-inset-bottom))',
        left: '50%',
        transform: 'translateX(-50%)',
        fontFamily: "'Courier New', monospace",
        fontSize: 10,
        letterSpacing: 2,
        color: '#6a5a48',
        textTransform: 'uppercase',
        textAlign: 'center',
        maxWidth: 300,
        userSelect: 'none',
      }}>
        {frame.subject}
      </div>

      {/* Tap to close hint */}
      <div style={{
        position: 'absolute',
        top: 'max(16px, env(safe-area-inset-top))',
        right: 16,
        fontFamily: "'Courier New', monospace",
        fontSize: 10,
        letterSpacing: 1,
        color: '#4a3a28',
        userSelect: 'none',
      }}>
        tap to close
      </div>
    </div>
  );
}
