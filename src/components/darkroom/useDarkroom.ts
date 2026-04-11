'use client';

import { useState, useCallback, useRef } from 'react';

export interface FrameState {
  id: number;
  developed: boolean;
  isDipping: boolean;
  photoUrl: string;
  subject: string;
}

export interface DarkroomPhoto {
  photoUrl: string;
  subject: string;
}

export function useDarkroom(photos: DarkroomPhoto[]) {
  const [frames, setFrames] = useState<FrameState[]>(() =>
    photos.map((photo, i) => ({
      id: i,
      developed: false,
      isDipping: false,
      photoUrl: photo.photoUrl,
      subject: photo.subject,
    }))
  );

  const [activeFrame, setActiveFrame] = useState<number | null>(null);
  const [revealedFrame, setRevealedFrame] = useState<number | null>(null);
  const dipLockRef = useRef(false);

  const dipFrame = useCallback((frameId: number) => {
    if (dipLockRef.current) return;

    const frame = frames.find(f => f.id === frameId);
    if (!frame || frame.isDipping) return;

    // If already developed, go straight to fullscreen
    if (frame.developed) {
      setRevealedFrame(frameId);
      return;
    }

    dipLockRef.current = true;
    setActiveFrame(frameId);

    setFrames(prev =>
      prev.map(f => f.id === frameId ? { ...f, isDipping: true } : f)
    );

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([15, 50, 15]);
    }

    // Develop completes after dip animation
    setTimeout(() => {
      setFrames(prev =>
        prev.map(f =>
          f.id === frameId
            ? { ...f, isDipping: false, developed: true }
            : f
        )
      );
      setActiveFrame(null);
      dipLockRef.current = false;

      // Reveal fullscreen after a brief pause to see the developed frame
      setTimeout(() => {
        setRevealedFrame(frameId);
      }, 400);
    }, 1000);
  }, [frames]);

  const dismissReveal = useCallback(() => {
    setRevealedFrame(null);
  }, []);

  return { frames, activeFrame, revealedFrame, dipFrame, dismissReveal };
}
