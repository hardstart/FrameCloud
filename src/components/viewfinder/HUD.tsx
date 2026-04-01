"use client";

interface HUDProps {
  albumTitle: string;
  currentIndex: number;
  totalPhotos: number;
  caption?: string;
  dateTaken?: string;
  visible: boolean;
}

// Static simulated exposure values — vary subtly by frame index
const EXPOSURE_PRESETS = [
  { fStop: "1.8", shutter: "1/250", iso: "400" },
  { fStop: "2.0", shutter: "1/320", iso: "400" },
  { fStop: "1.4", shutter: "1/500", iso: "200" },
  { fStop: "2.8", shutter: "1/125", iso: "800" },
  { fStop: "1.8", shutter: "1/400", iso: "320" },
  { fStop: "2.2", shutter: "1/200", iso: "500" },
  { fStop: "1.4", shutter: "1/640", iso: "160" },
  { fStop: "2.5", shutter: "1/160", iso: "640" },
];

/**
 * Viewfinder HUD — top info bar + bottom exposure readout.
 *
 * Additions over original:
 * - Animated exposure strip (f/, shutter, ISO) with EVF flicker
 * - Battery + mode indicator in top-right
 * - Subtle separator rule between caption and exposure data
 */
export default function HUD({
  albumTitle,
  currentIndex,
  totalPhotos,
  caption,
  dateTaken,
  visible,
}: HUDProps) {
  const shotNumber = String(currentIndex + 1).padStart(2, "0");
  const totalStr   = String(totalPhotos).padStart(2, "0");
  const exposure   = EXPOSURE_PRESETS[currentIndex % EXPOSURE_PRESETS.length];

  return (
    <div
      className="absolute inset-0 z-30 pointer-events-none flex flex-col justify-between transition-opacity duration-200"
      style={{ opacity: visible ? 1 : 0 }}
    >
      {/* ── Top row — album name / battery / shot counter ─────────── */}
      <div className="flex justify-between items-start px-3 sm:px-4 pt-3 sm:pt-4">
        {/* Album title */}
        <span
          className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.1em] text-white"
          style={{ textShadow: "0 1px 4px rgba(0,0,0,0.9)" }}
        >
          {albumTitle}
        </span>

        {/* Right cluster: battery + shot counter */}
        <div className="flex items-center gap-2.5">
          {/* Battery indicator */}
          <div className="flex items-center gap-0.5 evf-data" aria-hidden="true">
            <div
              className="flex gap-px items-center h-[8px]"
              style={{ border: "1px solid rgba(255,255,255,0.35)", padding: "1px", borderRadius: "1px" }}
            >
              {[1, 0.75, 0.5, 0.25].map((fill, i) => (
                <div
                  key={i}
                  className="w-[4px] h-full"
                  style={{
                    background:
                      fill > 0.3
                        ? "rgba(255,255,255,0.7)"
                        : "rgba(255,60,60,0.8)",
                  }}
                />
              ))}
            </div>
            <div
              className="w-[2px] h-[4px]"
              style={{ background: "rgba(255,255,255,0.35)", borderRadius: "0 1px 1px 0" }}
            />
          </div>

          {/* Shot counter */}
          <span
            className="font-mono text-[10px] sm:text-[11px] text-white"
            style={{ textShadow: "0 1px 4px rgba(0,0,0,0.9)" }}
          >
            {shotNumber}&thinsp;/&thinsp;{totalStr}
          </span>
        </div>
      </div>

      {/* ── Bottom cluster — caption + exposure readout ───────────── */}
      <div
        className="flex flex-col"
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.35) 80%, transparent 100%)",
        }}
      >
        {/* Caption + date row */}
        <div className="flex items-center justify-between px-3 sm:px-4 pt-3 pb-1.5">
          <span
            className="font-mono text-[9px] sm:text-[10px] tracking-wider"
            style={{ color: "#FF8C00", textShadow: "0 0 6px rgba(255,140,0,0.4)" }}
          >
            {caption ? `▸ ${caption}` : ""}
          </span>
          <span
            className="font-mono text-[9px] sm:text-[10px] tracking-wider"
            style={{ color: "#FF8C00", textShadow: "0 0 6px rgba(255,140,0,0.4)" }}
          >
            {dateTaken || ""}
          </span>
        </div>

        {/* Separator rule */}
        <div
          className="mx-3 sm:mx-4"
          style={{
            height: "1px",
            background:
              "linear-gradient(90deg, transparent, rgba(255,140,0,0.18) 20%, rgba(255,140,0,0.18) 80%, transparent)",
          }}
        />

        {/* Exposure data strip — f/, shutter, ISO, mode */}
        <div className="flex items-center justify-between px-3 sm:px-4 py-2">
          {/* Left: exposure triplet */}
          <div className="flex items-center gap-3 sm:gap-4 evf-data">
            <span
              className="font-mono text-[8px] sm:text-[9px] tabular-nums"
              style={{ color: "rgba(255,184,0,0.7)", letterSpacing: "0.05em" }}
            >
              <span style={{ color: "rgba(255,184,0,0.4)", fontSize: "0.7em" }}>f/</span>
              {exposure.fStop}
            </span>
            <span
              className="font-mono text-[8px] sm:text-[9px] tabular-nums"
              style={{ color: "rgba(255,184,0,0.7)", letterSpacing: "0.05em" }}
            >
              {exposure.shutter}
            </span>
            <span
              className="font-mono text-[8px] sm:text-[9px] tabular-nums"
              style={{ color: "rgba(255,184,0,0.7)", letterSpacing: "0.05em" }}
            >
              <span style={{ color: "rgba(255,184,0,0.4)", fontSize: "0.7em" }}>ISO</span>
              {exposure.iso}
            </span>
          </div>

          {/* Right: mode indicator */}
          <span
            className="font-mono text-[7px] sm:text-[8px] uppercase tracking-widest evf-data"
            style={{ color: "rgba(255,184,0,0.45)", animationDelay: "1.2s" }}
          >
            A
          </span>
        </div>
      </div>
    </div>
  );
}
