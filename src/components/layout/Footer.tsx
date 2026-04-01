const SPROCKET_COUNT = 9;

export default function Footer() {
  return (
    <footer className="relative mt-16 overflow-hidden select-none" aria-label="Site footer">
      {/* Top rule */}
      <div style={{ height: 1, background: "rgba(255,255,255,0.04)" }} />

      {/* Film strip */}
      <div
        style={{ background: "#060606", padding: "14px 0" }}
        aria-hidden="true"
      >
        {/* Top sprocket row */}
        <div className="flex items-center justify-between px-8 mb-3">
          {Array.from({ length: SPROCKET_COUNT }).map((_, i) => (
            <div key={i} className="sprocket-hole" />
          ))}
        </div>

        {/* Film data strip */}
        <div
          className="flex items-center justify-between px-8 py-1"
          style={{
            background: "rgba(255,184,0,0.03)",
            borderTop:    "1px solid rgba(255,184,0,0.08)",
            borderBottom: "1px solid rgba(255,184,0,0.08)",
          }}
        >
          <span
            className="font-mono"
            style={{ fontSize: 8, letterSpacing: "0.22em", color: "rgba(255,184,0,0.22)", textTransform: "uppercase" }}
          >
            FRAMECLOUD 200 ◆ 135-36
          </span>
          <span
            className="font-mono"
            style={{ fontSize: 8, letterSpacing: "0.22em", color: "rgba(255,255,255,0.15)", textTransform: "uppercase" }}
          >
            © {new Date().getFullYear()} FrameCloud
          </span>
          <span
            className="font-mono hidden sm:block"
            style={{ fontSize: 8, letterSpacing: "0.22em", color: "rgba(255,184,0,0.22)", textTransform: "uppercase" }}
          >
            DX ◆ ISO 200/24°
          </span>
        </div>

        {/* Bottom sprocket row */}
        <div className="flex items-center justify-between px-8 mt-3">
          {Array.from({ length: SPROCKET_COUNT }).map((_, i) => (
            <div key={i} className="sprocket-hole" />
          ))}
        </div>
      </div>
    </footer>
  );
}
