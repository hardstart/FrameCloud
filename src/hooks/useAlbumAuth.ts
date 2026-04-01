"use client";

import { useState } from "react";
import type { AuthResponse } from "@/lib/types";

export function useAlbumAuth(slug: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function authenticate(password: string): Promise<AuthResponse> {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, password }),
      });

      const data: AuthResponse = await res.json();

      if (!data.success) {
        setError(data.error || "Invalid password");
      }

      return data;
    } catch {
      setError("Connection error");
      return { success: false, error: "Connection error" };
    } finally {
      setLoading(false);
    }
  }

  return { authenticate, loading, error };
}
