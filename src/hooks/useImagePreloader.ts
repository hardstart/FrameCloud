"use client";

import { useCallback, useEffect, useRef } from "react";

export function useImagePreloader(
  imageUrls: string[],
  currentIndex: number,
  preloadAhead: number = 2
) {
  const preloadedRef = useRef<Set<string>>(new Set());

  const preload = useCallback((url: string) => {
    if (preloadedRef.current.has(url)) return;
    const img = new Image();
    img.src = url;
    preloadedRef.current.add(url);
  }, []);

  useEffect(() => {
    // Preload current + next N
    for (let i = currentIndex; i <= Math.min(currentIndex + preloadAhead, imageUrls.length - 1); i++) {
      if (imageUrls[i]) {
        preload(imageUrls[i]);
      }
    }
  }, [currentIndex, imageUrls, preloadAhead, preload]);

  return { preloadedCount: preloadedRef.current.size };
}
