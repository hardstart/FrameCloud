import FilmStrip from "./FilmStrip";

export default function Footer() {
  return (
    <footer className="relative mt-16 overflow-hidden select-none" aria-label="Site footer">
      {/* Top rule */}
      <div style={{ height: 1, background: "rgba(255,255,255,0.04)" }} />

      {/* Real film strip */}
      <FilmStrip />

      {/* Copyright */}
      <div
        className="flex items-center justify-center px-8 py-3"
        style={{ background: "#060606" }}
      >
        <span
          className="font-mono"
          style={{ fontSize: 8, letterSpacing: "0.22em", color: "rgba(255,255,255,0.15)", textTransform: "uppercase" }}
        >
          © {new Date().getFullYear()} FrameCloud
        </span>
      </div>
    </footer>
  );
}
