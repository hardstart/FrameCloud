"use client";

import { useEffect } from "react";

export default function ViewError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[DarkroomView] Error:", error);
    console.error("[DarkroomView] Stack:", error.stack);
  }, [error]);

  return (
    <div className="fixed inset-0 z-[300] bg-black flex items-center justify-center p-8 overflow-auto">
      <div className="max-w-3xl w-full">
        <p className="font-mono text-sm uppercase tracking-widest mb-4" style={{ color: "rgba(255,68,68,0.8)" }}>
          ERR — Darkroom Crash
        </p>
        <pre className="font-mono text-xs whitespace-pre-wrap break-words mb-4" style={{ color: "rgba(255,184,0,0.7)" }}>
          {error.name}: {error.message}
        </pre>
        {error.stack && (
          <pre className="font-mono text-[10px] whitespace-pre-wrap break-words mb-6 p-3 rounded" style={{ color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.03)" }}>
            {error.stack}
          </pre>
        )}
        {error.digest && (
          <p className="font-mono text-[10px] mb-4" style={{ color: "rgba(255,255,255,0.3)" }}>
            digest: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          className="font-mono text-xs uppercase tracking-wider px-4 py-2 rounded"
          style={{ color: "rgba(255,184,0,0.9)", border: "1px solid rgba(255,184,0,0.3)" }}
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
