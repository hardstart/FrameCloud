"use client";

import { useCallback, useRef } from "react";

interface UseScrollSnapOptions {
  threshold?: number;
  onNext: () => void;
  onPrev: () => void;
}

export function useScrollSnap({
  threshold = 50,
  onNext,
  onPrev,
}: UseScrollSnapOptions) {
  const accumulatorRef = useRef(0);
  const lockedRef = useRef(false);

  const handleWheel = useCallback(
    (deltaY: number) => {
      if (lockedRef.current) return;

      accumulatorRef.current += deltaY;

      if (Math.abs(accumulatorRef.current) >= threshold) {
        lockedRef.current = true;

        if (accumulatorRef.current > 0) {
          onNext();
        } else {
          onPrev();
        }

        accumulatorRef.current = 0;

        // Unlock after a short delay to prevent rapid-fire
        setTimeout(() => {
          lockedRef.current = false;
        }, 200);
      }
    },
    [threshold, onNext, onPrev]
  );

  const reset = useCallback(() => {
    accumulatorRef.current = 0;
    lockedRef.current = false;
  }, []);

  return { handleWheel, reset };
}
