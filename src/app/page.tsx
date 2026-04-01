import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import GalleryGrid from "@/components/gallery/GalleryGrid";
import { listAlbumSlugs, getAlbumManifest } from "@/lib/r2";
import type { AlbumPublicMeta } from "@/lib/types";

export const dynamic = "force-dynamic";

const SPROCKET_COUNT = 14;

export default async function GalleryPage() {
  const slugs = await listAlbumSlugs();
  const albums: AlbumPublicMeta[] = [];

  for (const slug of slugs) {
    const manifest = await getAlbumManifest(slug);
    if (!manifest) continue;
    albums.push({
      slug:                manifest.slug,
      title:               manifest.title,
      date:                manifest.date,
      coverImage:          `/api/image/${manifest.slug}/${manifest.coverImage}`,
      totalPhotos:         manifest.totalPhotos,
      isPasswordProtected: manifest.isPasswordProtected,
      description:         manifest.description,
    });
  }

  albums.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <main className="min-h-screen" style={{ background: "#0A0A0A" }}>
      <Header />

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section
        className="relative flex flex-col justify-end overflow-hidden"
        style={{ minHeight: "100svh", paddingTop: 80 }}
        aria-label="FrameCloud — visual archive"
      >
        {/* Film grain — animated */}
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='220' height='220' filter='url(%23g)'/%3E%3C/svg%3E")`,
            opacity: 0.03,
          }}
        />

        {/* Warm amber gradient — bottom-left */}
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 10% 95%, rgba(255,184,0,0.055) 0%, transparent 100%)",
          }}
        />

        {/* Vertical frame number strip — right edge */}
        <div
          className="absolute right-5 sm:right-9 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:flex flex-col items-center gap-4"
          aria-hidden="true"
          style={{ opacity: 0.2 }}
        >
          {["01", "02", "03", "04", "05", "06", "07"].map((n) => (
            <span
              key={n}
              className="font-mono"
              style={{
                fontSize: 7,
                letterSpacing: "0.18em",
                color: "rgba(255,184,0,0.9)",
                writingMode: "vertical-rl",
              }}
            >
              {n}
            </span>
          ))}
        </div>

        {/* Hero content */}
        <div className="relative px-6 sm:px-10 lg:px-14 pb-10 max-w-[1400px] mx-auto w-full">
          {/* Roll indicator */}
          <div
            className="hero-animate flex items-center gap-3 mb-8"
            style={{ animationDelay: "0.05s" }}
          >
            <div style={{ width: 28, height: 1, background: "rgba(255,184,0,0.5)" }} />
            <span
              className="font-mono uppercase"
              style={{
                fontSize: 9,
                letterSpacing: "0.32em",
                color: "rgba(255,184,0,0.55)",
              }}
            >
              Roll No. 001 ◆ FrameCloud
            </span>
          </div>

          {/* Main title */}
          <h1
            className="hero-animate font-sans font-semibold text-white"
            style={{
              animationDelay: "0.15s",
              fontSize: "clamp(4rem, 14vw, 13rem)",
              lineHeight: 0.88,
              letterSpacing: "-0.03em",
              marginBottom: "clamp(1.75rem, 4vw, 3.5rem)",
            }}
          >
            FrameCloud
          </h1>

          {/* Divider + tagline */}
          <div
            className="hero-animate flex items-center gap-5"
            style={{ animationDelay: "0.3s" }}
          >
            <div
              style={{
                width: 52,
                height: 1,
                background: "rgba(255,255,255,0.2)",
                flexShrink: 0,
              }}
            />
            <p
              className="font-mono uppercase"
              style={{
                fontSize: 10,
                letterSpacing: "0.24em",
                color: "rgba(255,255,255,0.38)",
              }}
            >
              A Visual Archive
            </p>
          </div>

          {/* Stats row */}
          <div
            className="hero-animate flex items-center gap-6 mt-10"
            style={{ animationDelay: "0.42s" }}
          >
            <div className="flex items-center gap-2">
              <span
                className="font-mono tabular-nums"
                style={{ fontSize: 22, fontWeight: 600, color: "rgba(255,184,0,0.75)", lineHeight: 1 }}
              >
                {albums.length}
              </span>
              <span
                className="font-mono uppercase"
                style={{ fontSize: 8, letterSpacing: "0.2em", color: "rgba(255,255,255,0.22)" }}
              >
                {albums.length === 1 ? "Roll" : "Rolls"}
              </span>
            </div>
            <div style={{ width: 1, height: 28, background: "rgba(255,255,255,0.08)" }} />
            <div className="flex items-center gap-2">
              <span
                className="font-mono tabular-nums"
                style={{ fontSize: 22, fontWeight: 600, color: "rgba(255,255,255,0.55)", lineHeight: 1 }}
              >
                {albums.reduce((sum, a) => sum + a.totalPhotos, 0)}
              </span>
              <span
                className="font-mono uppercase"
                style={{ fontSize: 8, letterSpacing: "0.2em", color: "rgba(255,255,255,0.22)" }}
              >
                Frames
              </span>
            </div>
          </div>

          {/* Scroll hint */}
          <div
            className="hero-animate flex items-center gap-3 mt-10"
            style={{ animationDelay: "0.58s" }}
          >
            <span
              className="font-mono uppercase"
              style={{
                fontSize: 8,
                letterSpacing: "0.3em",
                color: "rgba(255,255,255,0.18)",
              }}
            >
              Scroll
            </span>
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(255,255,255,0.18)"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <path d="M12 5v14M19 12l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Film strip separator — bottom of hero */}
        <div
          className="relative w-full pointer-events-none"
          aria-hidden="true"
          style={{ background: "#050505", borderTop: "1px solid rgba(255,255,255,0.05)" }}
        >
          {/* Top sprocket row */}
          <div className="flex items-center justify-between px-6 pt-2.5 pb-1">
            {Array.from({ length: SPROCKET_COUNT }).map((_, i) => (
              <div key={i} className="sprocket-hole" />
            ))}
          </div>

          {/* Film data stripe */}
          <div
            className="flex items-center gap-8 px-6 py-1"
            style={{
              background: "rgba(255,184,0,0.025)",
              borderTop: "1px solid rgba(255,184,0,0.07)",
              borderBottom: "1px solid rgba(255,184,0,0.07)",
            }}
          >
            <span
              className="font-mono"
              style={{ fontSize: 7, letterSpacing: "0.26em", color: "rgba(255,184,0,0.28)", textTransform: "uppercase" }}
            >
              FRAMECLOUD 200 ◆ 135-36
            </span>
            <span
              className="font-mono"
              style={{ fontSize: 7, letterSpacing: "0.26em", color: "rgba(255,255,255,0.12)", textTransform: "uppercase" }}
            >
              DX ◆ ISO 200/24°
            </span>
          </div>

          {/* Bottom sprocket row */}
          <div className="flex items-center justify-between px-6 pt-1 pb-2.5">
            {Array.from({ length: SPROCKET_COUNT }).map((_, i) => (
              <div key={i} className="sprocket-hole" />
            ))}
          </div>
        </div>
      </section>

      {/* ── Archive ─────────────────────────────────────────────────── */}
      <section
        className="px-6 sm:px-10 lg:px-14 pb-24 pt-14 max-w-[1400px] mx-auto"
        aria-label="Photo albums"
      >
        {/* Section header */}
        <div className="flex items-center gap-4 mb-10 sm:mb-12">
          <div
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: "rgba(255,184,0,0.6)",
              flexShrink: 0,
            }}
          />
          <span
            className="font-mono uppercase"
            style={{ fontSize: 8, letterSpacing: "0.3em", color: "rgba(255,255,255,0.3)" }}
          >
            Archive — {albums.length} {albums.length === 1 ? "roll" : "rolls"}
          </span>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.05)" }} />
        </div>

        <GalleryGrid albums={albums} />
      </section>

      <Footer />
    </main>
  );
}
