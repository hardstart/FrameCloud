"use client";

export default function Error({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-bg-primary flex items-center justify-center">
      <div className="text-center">
        <p
          className="font-mono text-sm uppercase tracking-wider mb-4"
          style={{ color: "var(--accent-red)" }}
        >
          ERR — Something went wrong
        </p>
        <button
          onClick={reset}
          className="font-mono text-xs text-text-secondary uppercase tracking-wider hover:text-text-primary transition-colors"
        >
          Try Again
        </button>
      </div>
    </main>
  );
}
