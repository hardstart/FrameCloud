'use client';

import { useEffect, useRef } from 'react';

export function Atmosphere() {
  const grainRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = grainRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = 256;
    canvas.height = 256;

    let raf: number;
    let tick = 0;
    const draw = () => {
      tick++;
      if (tick % 4 === 0) {
        const img = ctx.createImageData(256, 256);
        const d = img.data;
        for (let i = 0; i < d.length; i += 4) {
          const v = Math.random() * 255;
          d[i] = v; d[i + 1] = v; d[i + 2] = v;
          d[i + 3] = 12;
        }
        ctx.putImageData(img, 0, 0);
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <>
      {/* Film grain */}
      <canvas
        ref={grainRef}
        style={{
          position: 'fixed', inset: 0,
          width: '100%', height: '100%',
          pointerEvents: 'none',
          zIndex: 30,
          opacity: 0.25,
          mixBlendMode: 'overlay',
        }}
      />

      {/* Vignette */}
      <div style={{
        position: 'fixed', inset: 0,
        background: 'radial-gradient(ellipse at 50% 45%, transparent 35%, rgba(3, 2, 1, 0.75) 100%)',
        pointerEvents: 'none',
        zIndex: 25,
      }} />

      {/* Red safelight glow */}
      <div style={{
        position: 'fixed',
        top: -100, right: -100,
        width: 500, height: 500,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,25,0,0.08) 0%, rgba(255,25,0,0.02) 40%, transparent 65%)',
        pointerEvents: 'none',
        zIndex: 20,
        animation: 'safelightPulse 5s ease-in-out infinite',
      }} />

      <style>{`
        @keyframes safelightPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.65; }
        }
      `}</style>
    </>
  );
}
