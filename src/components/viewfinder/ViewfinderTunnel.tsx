"use client";

import { ReactNode } from "react";

interface ViewfinderTunnelProps {
  children: ReactNode;
  visible: boolean;
}

/**
 * The signature visual element — the viewfinder eyepiece tunnel.
 * Creates the "peering through a camera eyepiece" effect with:
 * - Outer black viewport
 * - Eyepiece housing (dark charcoal, beveled, rubber texture)
 * - Depth gradient (tunnel receding effect)
 * - Inner bevel ring with heavy inset shadows
 * - Viewfinder opening with 12px #111 border + scanline glass overlay
 * - Lens reflection highlight at top-center (ambient light catch on glass)
 */
export default function ViewfinderTunnel({ children, visible }: ViewfinderTunnelProps) {
  return (
    <div
      className="fixed inset-0 z-10 transition-opacity duration-300"
      style={{ opacity: visible ? 1 : 0 }}
    >
      {/* Layer 1: Pure black viewport background */}
      <div className="absolute inset-0 bg-black" />

      {/* Layer 2: Eyepiece housing */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="relative"
          style={{
            width: "85vw",
            height: "85vh",
            maxWidth: "1200px",
            maxHeight: "900px",
          }}
        >
          {/* Outer eyecup — rubber-textured rounded rectangle */}
          <div
            className="absolute inset-0 rounded-[28px] sm:rounded-[36px]"
            style={{
              background: "linear-gradient(145deg, #222 0%, #1a1a1a 30%, #151515 60%, #111 100%)",
              boxShadow:
                "inset 0 2px 8px rgba(255,255,255,0.03), inset 0 -2px 8px rgba(0,0,0,0.5), " +
                "0 0 0 1px rgba(255,255,255,0.02), " +
                "0 8px 60px rgba(0,0,0,0.9), 0 2px 20px rgba(0,0,0,0.8)",
            }}
          >
            {/* Rubber texture overlay */}
            <div
              className="absolute inset-0 rounded-[28px] sm:rounded-[36px] opacity-30"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='6' height='6' viewBox='0 0 6 6' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='1' height='1' x='0' y='0' fill='%23000' fill-opacity='0.15'/%3E%3Crect width='1' height='1' x='3' y='3' fill='%23000' fill-opacity='0.1'/%3E%3C/svg%3E")`,
              }}
            />
          </div>

          {/* Layer 3: Tunnel depth gradient — receding effect */}
          <div
            className="absolute rounded-[20px] sm:rounded-[28px]"
            style={{
              inset: "6%",
              background: "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.4) 75%, rgba(0,0,0,0.7) 100%)",
            }}
          />

          {/* Inner bevel ring — transition from housing to glass */}
          <div
            className="absolute rounded-[14px] sm:rounded-[20px]"
            style={{
              inset: "10%",
              boxShadow:
                "inset 0 0 30px rgba(0,0,0,0.9), inset 0 0 80px rgba(0,0,0,0.5), " +
                "0 0 40px rgba(0,0,0,0.7), 0 0 2px rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.03)",
            }}
          />

          {/* Layer 4: Viewfinder opening — where the photo lives */}
          {/* 12px solid #111 border + heavy inset shadows per spec */}
          <div
            className="absolute overflow-hidden rounded-[10px] sm:rounded-[14px]"
            style={{
              inset: "12%",
              border: "12px solid #111",
              boxShadow:
                "inset 0 0 20px rgba(0,0,0,0.7), " +
                "inset 0 0 60px rgba(0,0,0,0.3), " +
                "0 0 0 1px rgba(0,0,0,0.9), " +
                "0 0 30px rgba(0,0,0,0.8), " +
                "0 0 80px rgba(0,0,0,0.6)",
            }}
          >
            {children}

            {/* Glass scanline overlay — very subtle horizontal lines on the EVF glass */}
            <div
              className="absolute inset-0 z-10 pointer-events-none viewfinder-glass-scanlines"
              aria-hidden="true"
            />

            {/* Lens reflection — faint specular sheen at top of glass surface */}
            <div
              className="absolute inset-x-0 top-0 z-10 pointer-events-none"
              aria-hidden="true"
              style={{
                height: "35%",
                background:
                  "radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.035) 0%, transparent 70%)",
              }}
            />

            {/* Corner vignette — darkens the four corners slightly for depth */}
            <div
              className="absolute inset-0 z-10 pointer-events-none"
              aria-hidden="true"
              style={{
                background:
                  "radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.25) 85%, rgba(0,0,0,0.45) 100%)",
              }}
            />
          </div>

          {/* Subtle highlight on top edge of housing — ambient light catch */}
          <div
            className="absolute top-0 left-[15%] right-[15%] h-[1px] rounded-full"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)",
            }}
          />

          {/* Side edge catches — very faint left/right ambient reflections */}
          <div
            className="absolute left-0 top-[20%] bottom-[20%] w-[1px]"
            style={{
              background: "linear-gradient(to bottom, transparent, rgba(255,255,255,0.025), transparent)",
            }}
          />
          <div
            className="absolute right-0 top-[20%] bottom-[20%] w-[1px]"
            style={{
              background: "linear-gradient(to bottom, transparent, rgba(255,255,255,0.02), transparent)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
