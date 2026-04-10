import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import FilmStrip from "@/components/layout/FilmStrip";

export default function LandingPage() {
  return (
    <main className="min-h-screen" style={{ background: "#0A0A0A" }}>
      <Header />

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section
        className="relative flex flex-col justify-center overflow-hidden"
        style={{ minHeight: "100svh", paddingTop: 80 }}
      >
        {/* Film grain */}
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='220' height='220' filter='url(%23g)'/%3E%3C/svg%3E")`,
            opacity: 0.03,
          }}
        />

        {/* Warm amber gradient */}
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 10% 95%, rgba(255,184,0,0.055) 0%, transparent 100%)",
          }}
        />

        {/* Frame numbers — right edge */}
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
        <div className="relative px-6 sm:px-10 lg:px-14 max-w-[1400px] mx-auto w-full">
          {/* Roll indicator */}
          <div className="hero-animate flex items-center gap-3 mb-8" style={{ animationDelay: "0.05s" }}>
            <div style={{ width: 28, height: 1, background: "rgba(255,184,0,0.5)" }} />
            <span
              className="font-mono uppercase"
              style={{ fontSize: 9, letterSpacing: "0.32em", color: "rgba(255,184,0,0.55)" }}
            >
              Cinematic Photo Sharing ◆ FrameCloud
            </span>
          </div>

          {/* Main title */}
          <h1
            className="hero-animate font-sans font-semibold text-white"
            style={{
              animationDelay: "0.15s",
              fontSize: "clamp(3.5rem, 12vw, 11rem)",
              lineHeight: 0.88,
              letterSpacing: "-0.03em",
              marginBottom: "clamp(1.75rem, 4vw, 3.5rem)",
            }}
          >
            FrameCloud
          </h1>

          {/* Tagline */}
          <div className="hero-animate flex items-center gap-5" style={{ animationDelay: "0.3s" }}>
            <div style={{ width: 52, height: 1, background: "rgba(255,255,255,0.2)", flexShrink: 0 }} />
            <p
              className="font-mono uppercase"
              style={{ fontSize: 10, letterSpacing: "0.24em", color: "rgba(255,255,255,0.38)" }}
            >
              Your photos. Your rolls. Shared cinematically.
            </p>
          </div>

          {/* Description */}
          <p
            className="hero-animate font-sans max-w-lg mt-8"
            style={{
              animationDelay: "0.42s",
              fontSize: 16,
              lineHeight: 1.7,
              color: "rgba(255,255,255,0.45)",
            }}
          >
            Create private photo albums, upload your frames, and share them
            through password-protected links — all wrapped in a cinematic
            camera viewfinder experience.
          </p>

          {/* CTA buttons */}
          <div className="hero-animate flex items-center gap-4 mt-10" style={{ animationDelay: "0.55s" }}>
            <Link
              href="/signup"
              className="inline-block font-mono uppercase px-7 py-3 rounded transition-all"
              style={{
                fontSize: 10,
                letterSpacing: "0.22em",
                background: "rgba(255,184,0,0.2)",
                color: "rgba(255,184,0,0.95)",
                border: "1px solid rgba(255,184,0,0.3)",
              }}
            >
              Get Started
            </Link>
            <Link
              href="/login"
              className="inline-block font-mono uppercase px-7 py-3 rounded transition-all"
              style={{
                fontSize: 10,
                letterSpacing: "0.22em",
                color: "rgba(255,255,255,0.4)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Film strip separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <FilmStrip />
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────── */}
      <section className="px-6 sm:px-10 lg:px-14 py-24 max-w-[1400px] mx-auto">
        {/* Section header */}
        <div className="flex items-center gap-4 mb-16">
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: "rgba(255,184,0,0.6)", flexShrink: 0 }} />
          <span
            className="font-mono uppercase"
            style={{ fontSize: 8, letterSpacing: "0.3em", color: "rgba(255,255,255,0.3)" }}
          >
            How It Works
          </span>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.05)" }} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-8">
          {[
            {
              number: "01",
              title: "Create Your Rolls",
              desc: "Sign up and create albums. Organize your photos into rolls — each one gets its own cinematic viewer.",
            },
            {
              number: "02",
              title: "Upload Frames",
              desc: "Drag and drop your photos. They're stored securely in the cloud and served fast from the edge.",
            },
            {
              number: "03",
              title: "Share with a Link",
              desc: "Generate a password-protected share link for any album. Recipients view your photos through the camera viewfinder experience.",
            },
          ].map((feature) => (
            <div key={feature.number}>
              <span
                className="font-mono block mb-4"
                style={{ fontSize: 28, fontWeight: 600, color: "rgba(255,184,0,0.2)", lineHeight: 1 }}
              >
                {feature.number}
              </span>
              <h3
                className="font-sans font-medium mb-3"
                style={{ fontSize: 17, color: "#F5F5F5" }}
              >
                {feature.title}
              </h3>
              <p
                className="font-mono"
                style={{ fontSize: 12, lineHeight: 1.7, color: "rgba(255,255,255,0.35)" }}
              >
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bottom CTA ────────────────────────────────────────────── */}
      <section className="px-6 sm:px-10 lg:px-14 pb-24 max-w-[1400px] mx-auto text-center">
        <div
          className="rounded-lg py-16 px-8"
          style={{ background: "#111", border: "1px solid rgba(255,255,255,0.04)" }}
        >
          <div className="font-mono mb-3" style={{ fontSize: 32, color: "rgba(255,184,0,0.15)" }}>◆</div>
          <h2 className="font-sans font-semibold mb-3" style={{ fontSize: 24, color: "#F5F5F5" }}>
            Start shooting
          </h2>
          <p className="font-mono mb-8 mx-auto max-w-md" style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", lineHeight: 1.7 }}>
            Create your free account and upload your first roll in under a minute.
          </p>
          <Link
            href="/signup"
            className="inline-block font-mono uppercase px-8 py-3 rounded transition-all"
            style={{
              fontSize: 10,
              letterSpacing: "0.22em",
              background: "rgba(255,184,0,0.2)",
              color: "rgba(255,184,0,0.95)",
              border: "1px solid rgba(255,184,0,0.3)",
            }}
          >
            Create Account
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
