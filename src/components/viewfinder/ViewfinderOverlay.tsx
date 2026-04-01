"use client";

interface ViewfinderOverlayProps {
  visible: boolean;
}

/**
 * EVF overlay — sits inside the viewfinder opening, on top of the photo.
 *
 * Elements (all real EVF conventions):
 * - Corner L-brackets at 15% inset (composition frame lines)
 * - Center AF brackets [ ] with cross-hair dot
 * - Sparse AF-point grid (tiny inactive dots)
 * - Vertical exposure metering scale (right edge)
 * - Horizontal level indicator (bottom center)
 * - Subtle 1/3 rule composition guides (very faint)
 *
 * Frame bracket positions use 15% inset as specified:
 *   viewBox 1000×750 → 15% = 150 (H), 112 (V); 85% = 850 (H), 637 (V)
 */
export default function ViewfinderOverlay({ visible }: ViewfinderOverlayProps) {
  return (
    <div
      className="absolute inset-0 z-20 pointer-events-none transition-opacity duration-200"
      style={{ opacity: visible ? 1 : 0 }}
    >
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1000 750"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        {/* ── Corner frame lines at 15% inset ── */}
        {/* Top-left  — L bracket opening down-right */}
        <path d="M 150 112 L 150 165" stroke="rgba(255,255,255,0.72)" strokeWidth="1.3" fill="none" />
        <path d="M 150 112 L 203 112" stroke="rgba(255,255,255,0.72)" strokeWidth="1.3" fill="none" />
        {/* Top-right — L bracket opening down-left */}
        <path d="M 850 112 L 850 165" stroke="rgba(255,255,255,0.72)" strokeWidth="1.3" fill="none" />
        <path d="M 850 112 L 797 112" stroke="rgba(255,255,255,0.72)" strokeWidth="1.3" fill="none" />
        {/* Bottom-left — L bracket opening up-right */}
        <path d="M 150 637 L 150 584" stroke="rgba(255,255,255,0.72)" strokeWidth="1.3" fill="none" />
        <path d="M 150 637 L 203 637" stroke="rgba(255,255,255,0.72)" strokeWidth="1.3" fill="none" />
        {/* Bottom-right — L bracket opening up-left */}
        <path d="M 850 637 L 850 584" stroke="rgba(255,255,255,0.72)" strokeWidth="1.3" fill="none" />
        <path d="M 850 637 L 797 637" stroke="rgba(255,255,255,0.72)" strokeWidth="1.3" fill="none" />

        {/* ── Center AF brackets ── */}
        {/* Left bracket [ */}
        <path d="M 467 338 L 467 412"   stroke="rgba(255,255,255,0.65)" strokeWidth="1.1" fill="none" />
        <path d="M 467 338 L 481 338"   stroke="rgba(255,255,255,0.65)" strokeWidth="1.1" fill="none" />
        <path d="M 467 412 L 481 412"   stroke="rgba(255,255,255,0.65)" strokeWidth="1.1" fill="none" />
        {/* Right bracket ] */}
        <path d="M 533 338 L 533 412"   stroke="rgba(255,255,255,0.65)" strokeWidth="1.1" fill="none" />
        <path d="M 533 338 L 519 338"   stroke="rgba(255,255,255,0.65)" strokeWidth="1.1" fill="none" />
        <path d="M 533 412 L 519 412"   stroke="rgba(255,255,255,0.65)" strokeWidth="1.1" fill="none" />
        {/* Center crosshair dot */}
        <circle cx="500" cy="375" r="1.8" fill="rgba(255,255,255,0.35)" />
        {/* Crosshair ticks */}
        <path d="M 494 375 L 491 375"   stroke="rgba(255,255,255,0.25)" strokeWidth="0.8" fill="none" />
        <path d="M 506 375 L 509 375"   stroke="rgba(255,255,255,0.25)" strokeWidth="0.8" fill="none" />
        <path d="M 500 369 L 500 366"   stroke="rgba(255,255,255,0.25)" strokeWidth="0.8" fill="none" />
        <path d="M 500 381 L 500 384"   stroke="rgba(255,255,255,0.25)" strokeWidth="0.8" fill="none" />

        {/* ── Sparse AF-point grid (inactive dots) ── */}
        {(
          [
            [250,188],[400,188],[550,188],[700,188],
            [250,375],[400,375],          [600,375],[750,375],
            [250,562],[400,562],[550,562],[700,562],
          ] as Array<[number, number]>
        ).map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="1.6" fill="rgba(255,255,255,0.10)" />
        ))}

        {/* ── Vertical exposure metering scale (right edge) ── */}
        {/* Scale track */}
        <line x1="940" y1="268" x2="940" y2="482" stroke="rgba(255,255,255,0.14)" strokeWidth="0.8" />
        {/* Scale ticks */}
        {[-3,-2,-1,0,1,2,3].map((stop) => {
          const y = 375 + stop * (-30.5);
          const isZero = stop === 0;
          return (
            <g key={stop}>
              <line
                x1={isZero ? 928 : 933}
                y1={y}
                x2="940"
                y2={y}
                stroke={isZero ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.22)"}
                strokeWidth={isZero ? 1.2 : 0.8}
              />
            </g>
          );
        })}
        {/* Current metering indicator (static at 0 EV) */}
        <polygon points="922,375 928,371 928,379" fill="rgba(255,255,255,0.6)" />

        {/* ── Horizontal level indicator (bottom center) ── */}
        {/* Track */}
        <line x1="420" y1="710" x2="580" y2="710" stroke="rgba(255,255,255,0.13)" strokeWidth="0.8" />
        {/* Center mark */}
        <line x1="500" y1="706" x2="500" y2="714" stroke="rgba(255,255,255,0.45)" strokeWidth="1" />
        {/* Level bubble (centered = level) */}
        <circle cx="500" cy="710" r="3" fill="none" stroke="rgba(255,255,255,0.38)" strokeWidth="0.9" />

        {/* ── Subtle rule lines at 1/3 composition guides (very faint) ── */}
        <line x1="333" y1="112" x2="333" y2="637" stroke="rgba(255,255,255,0.035)" strokeWidth="0.7" />
        <line x1="667" y1="112" x2="667" y2="637" stroke="rgba(255,255,255,0.035)" strokeWidth="0.7" />
        <line x1="150" y1="249" x2="850" y2="249"  stroke="rgba(255,255,255,0.035)" strokeWidth="0.7" />
        <line x1="150" y1="500" x2="850" y2="500"  stroke="rgba(255,255,255,0.035)" strokeWidth="0.7" />
      </svg>
    </div>
  );
}
