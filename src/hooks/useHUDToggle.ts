"use client";

import { useState, useCallback } from "react";

export function useHUDToggle(defaultVisible: boolean = true) {
  const [hudVisible, setHudVisible] = useState(defaultVisible);

  const toggleHUD = useCallback(() => {
    setHudVisible((prev) => !prev);
  }, []);

  return { hudVisible, toggleHUD };
}
