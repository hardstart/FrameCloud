'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { DarkroomScene } from './DarkroomScene';
import { Atmosphere } from './Atmosphere';
import { PhotoReveal } from './PhotoReveal';
import { useDarkroom } from './useDarkroom';
import type { DarkroomPhoto } from './useDarkroom';

interface DarkroomViewerProps {
  photos: DarkroomPhoto[];
  albumTitle: string;
  backHref: string;
  backLabel?: string;
}

export default function DarkroomViewer({ photos, albumTitle, backHref, backLabel = 'Back' }: DarkroomViewerProps) {
  const { frames, activeFrame, revealedFrame, dipFrame, dismissReveal } = useDarkroom(photos);
  const [scrollOffset, setScrollOffset] = useState(0);
  const maxScroll = frames.length - 1;
  const scrollAccum = useRef(0);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      scrollAccum.current += e.deltaY * 0.003;
      scrollAccum.current = Math.max(0, Math.min(maxScroll, scrollAccum.current));
      setScrollOffset(scrollAccum.current);
    };

    let touchStartY = 0;
    let touchScrollStart = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
      touchScrollStart = scrollAccum.current;
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const dy = touchStartY - e.touches[0].clientY;
      scrollAccum.current = Math.max(0, Math.min(maxScroll, touchScrollStart + dy * 0.008));
      setScrollOffset(scrollAccum.current);
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [maxScroll]);

  const handleDip = useCallback((frameId: number) => {
    dipFrame(frameId);
  }, [dipFrame]);

  const revealedFrameData = revealedFrame !== null
    ? frames.find(f => f.id === revealedFrame) ?? null
    : null;

  // Prompt text
  const activeData = activeFrame !== null ? frames.find(f => f.id === activeFrame) : null;
  let prompt = 'Tap a frame to develop';
  if (activeData?.isDipping) {
    prompt = 'Developing...';
  } else if (revealedFrame !== null) {
    prompt = '';
  }

  return (
    <div style={{
      width: '100%',
      height: '100dvh',
      position: 'relative',
      overflow: 'hidden',
      background: '#060302',
      touchAction: 'none',
    }}>
      {/* 3D scene */}
      <DarkroomScene
        frames={frames}
        activeFrame={activeFrame}
        scrollOffset={scrollOffset}
        onDip={handleDip}
      />

      {/* Atmosphere */}
      <Atmosphere />

      {/* Fullscreen photo reveal */}
      <PhotoReveal frame={revealedFrameData} onDismiss={dismissReveal} />

      {/* Prompt */}
      {prompt && (
        <div style={{
          position: 'fixed',
          bottom: 'max(24px, env(safe-area-inset-bottom))',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 40,
          fontFamily: "'Courier New', monospace",
          fontSize: 11,
          letterSpacing: 2,
          textTransform: 'uppercase',
          color: activeData?.isDipping ? '#c87830' : '#5a4a38',
          transition: 'color 0.4s',
          textShadow: activeData?.isDipping ? '0 0 8px rgba(200,120,48,0.4)' : 'none',
          userSelect: 'none',
        }}>
          {prompt}
        </div>
      )}

      {/* Scroll position dots */}
      <div style={{
        position: 'fixed',
        right: 12,
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 40,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        alignItems: 'center',
      }}>
        {frames.map((f, i) => (
          <div
            key={i}
            style={{
              width: Math.abs(i - scrollOffset) < 0.5 ? 8 : 4,
              height: Math.abs(i - scrollOffset) < 0.5 ? 8 : 4,
              borderRadius: '50%',
              background: f.developed
                ? '#c87830'
                : Math.abs(i - scrollOffset) < 0.5
                  ? '#8a6a40'
                  : '#2a1a0a',
              transition: 'all 0.3s',
              boxShadow: f.developed ? '0 0 4px #c87830' : 'none',
            }}
          />
        ))}
      </div>

      {/* Frame counter */}
      <div style={{
        position: 'fixed',
        bottom: 'max(48px, calc(env(safe-area-inset-bottom) + 36px))',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 40,
        fontFamily: "'Courier New', monospace",
        fontSize: 9,
        letterSpacing: 3,
        color: '#3a2a18',
        userSelect: 'none',
      }}>
        {Math.round(scrollOffset) + 1} / {frames.length}
      </div>

      {/* Album title */}
      <div style={{
        position: 'fixed',
        top: 'max(12px, env(safe-area-inset-top))',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 40,
        fontFamily: "'Courier New', monospace",
        fontSize: 10,
        letterSpacing: 5,
        textTransform: 'uppercase',
        color: '#4a3a28',
        userSelect: 'none',
      }}>
        {albumTitle}
      </div>

      {/* Back button */}
      <a
        href={backHref}
        style={{
          position: 'fixed',
          top: 'max(12px, env(safe-area-inset-top))',
          left: 12,
          zIndex: 40,
          fontFamily: "'Courier New', monospace",
          fontSize: 10,
          letterSpacing: 1,
          textTransform: 'uppercase',
          color: '#4a3a28',
          textDecoration: 'none',
          userSelect: 'none',
          cursor: 'pointer',
        }}
      >
        &larr; {backLabel}
      </a>
    </div>
  );
}
