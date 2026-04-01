import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-bg-primary flex items-center justify-center">
      <div className="text-center">
        <p className="font-mono text-6xl text-lcd-amber mb-4">404</p>
        <p className="font-mono text-sm text-text-secondary uppercase tracking-wider mb-8">
          Frame not found
        </p>
        <Link
          href="/"
          className="font-mono text-xs text-text-secondary uppercase tracking-wider hover:text-text-primary transition-colors"
        >
          Back to Gallery
        </Link>
      </div>
    </main>
  );
}
