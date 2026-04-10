"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Props {
  token: string;
  albumTitle: string;
}

export default function SharedPasswordGate({ token, albumTitle }: Props) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/shared/${token}/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Incorrect password");
        setLoading(false);
        return;
      }

      // Refresh the page — server will now see the cookie and show the album
      router.refresh();
    } catch {
      setError("Network error");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{ background: "#0A0A0A" }}>
      <div className="film-grain-overlay" aria-hidden="true" />

      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-block">
            <span className="font-mono uppercase" style={{ fontSize: 11, letterSpacing: "0.32em", color: "rgba(255,184,0,0.7)" }}>◆</span>
            <span className="font-mono uppercase ml-3" style={{ fontSize: 11, letterSpacing: "0.28em", color: "rgba(245,245,245,0.75)" }}>FrameCloud</span>
          </Link>
          <div className="flex items-center gap-3 justify-center mt-6">
            <div style={{ width: 28, height: 1, background: "rgba(255,184,0,0.3)" }} />
            <span className="font-mono uppercase" style={{ fontSize: 9, letterSpacing: "0.3em", color: "rgba(255,255,255,0.3)" }}>
              Shared Album
            </span>
            <div style={{ width: 28, height: 1, background: "rgba(255,184,0,0.3)" }} />
          </div>
        </div>

        {/* Card */}
        <div
          className="rounded-lg p-8"
          style={{
            background: "#141414",
            border: "1px solid rgba(255,255,255,0.06)",
            boxShadow: "0 0 60px rgba(0,0,0,0.5)",
          }}
        >
          <div className="text-center mb-6">
            <div className="font-mono mb-2" style={{ fontSize: 24, color: "rgba(255,184,0,0.15)" }}>◆</div>
            <h1 className="font-sans font-medium" style={{ fontSize: 18, color: "#F5F5F5" }}>{albumTitle}</h1>
            <p className="font-mono mt-2" style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
              This album is password protected
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div
                className="font-mono text-center py-2 rounded"
                style={{ fontSize: 11, color: "#FF4444", background: "rgba(255,68,68,0.08)", border: "1px solid rgba(255,68,68,0.15)" }}
              >
                {error}
              </div>
            )}

            <div>
              <label
                className="block font-mono uppercase mb-2"
                style={{ fontSize: 9, letterSpacing: "0.2em", color: "rgba(255,255,255,0.35)" }}
              >
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
                className="w-full px-4 py-3 rounded font-mono outline-none transition-colors"
                style={{
                  fontSize: 13,
                  background: "#0A0A0A",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#F5F5F5",
                }}
                onFocus={(e) => (e.target.style.borderColor = "rgba(255,184,0,0.3)")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
                placeholder="Enter album password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded font-mono uppercase transition-all"
              style={{
                fontSize: 10,
                letterSpacing: "0.22em",
                background: loading ? "rgba(255,184,0,0.15)" : "rgba(255,184,0,0.2)",
                color: "rgba(255,184,0,0.9)",
                border: "1px solid rgba(255,184,0,0.25)",
              }}
            >
              {loading ? "Verifying..." : "View Album"}
            </button>
          </form>
        </div>

        {/* Film data line */}
        <div className="flex items-center gap-4 justify-center mt-8">
          <span
            className="font-mono"
            style={{ fontSize: 7, letterSpacing: "0.2em", color: "rgba(255,184,0,0.15)", textTransform: "uppercase" }}
          >
            FRAMECLOUD 200 ◆ SECURE
          </span>
        </div>
      </div>
    </main>
  );
}
