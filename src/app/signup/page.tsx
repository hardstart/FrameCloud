"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Signup failed");
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    fontSize: 13,
    background: "#0A0A0A",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "#F5F5F5",
  };

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
            <span className="font-mono uppercase" style={{ fontSize: 9, letterSpacing: "0.3em", color: "rgba(255,255,255,0.3)" }}>Create Account</span>
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
              <label className="block font-mono uppercase mb-2" style={{ fontSize: 9, letterSpacing: "0.2em", color: "rgba(255,255,255,0.35)" }}>Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 rounded font-mono outline-none transition-colors"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = "rgba(255,184,0,0.3)")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
              />
            </div>

            <div>
              <label className="block font-mono uppercase mb-2" style={{ fontSize: 9, letterSpacing: "0.2em", color: "rgba(255,255,255,0.35)" }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded font-mono outline-none transition-colors"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = "rgba(255,184,0,0.3)")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
              />
            </div>

            <div>
              <label className="block font-mono uppercase mb-2" style={{ fontSize: 9, letterSpacing: "0.2em", color: "rgba(255,255,255,0.35)" }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-4 py-3 rounded font-mono outline-none transition-colors"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = "rgba(255,184,0,0.3)")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
              />
              <span className="font-mono block mt-1" style={{ fontSize: 9, color: "rgba(255,255,255,0.2)" }}>Min. 8 characters</span>
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
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = "rgba(255,184,0,0.3)"; }}
              onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = "rgba(255,184,0,0.2)"; }}
            >
              {loading ? "Creating..." : "Create Account"}
            </button>
          </form>

          <div className="text-center mt-6">
            <span className="font-mono" style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Already have an account? </span>
            <Link href="/login" className="font-mono transition-colors" style={{ fontSize: 11, color: "rgba(255,184,0,0.7)" }}>Sign in</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
