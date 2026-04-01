import Link from "next/link";

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Film-edge top strip — 3 amber sprocket dots */}
      <div
        className="flex items-center gap-[7px] px-6 sm:px-8 py-[5px]"
        style={{ background: "#060606", borderBottom: "1px solid rgba(255,255,255,0.03)" }}
        aria-hidden="true"
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: i === 1 ? "rgba(255,184,0,0.35)" : "rgba(255,255,255,0.07)",
            }}
          />
        ))}
        <span
          className="font-mono ml-2"
          style={{ fontSize: 9, color: "rgba(255,184,0,0.25)", letterSpacing: "0.25em" }}
        >
          FRAMECLOUD 200
        </span>
      </div>

      {/* Main nav bar */}
      <div
        className="flex items-center justify-between px-6 sm:px-8 py-4"
        style={{
          background: "rgba(10,10,10,0.88)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(255,255,255,0.045)",
        }}
      >
        {/* Wordmark */}
        <Link href="/" className="group flex items-center gap-3" aria-label="FrameCloud home">
          <span
            className="font-mono uppercase transition-colors duration-300"
            style={{
              fontSize: 11,
              letterSpacing: "0.32em",
              color: "rgba(255,184,0,0.7)",
            }}
          >
            ◆
          </span>
          <span
            className="font-mono uppercase transition-colors duration-300 group-hover:text-white"
            style={{
              fontSize: 11,
              letterSpacing: "0.28em",
              color: "rgba(245,245,245,0.75)",
            }}
          >
            FrameCloud
          </span>
        </Link>

        {/* Right — subtle roll indicator */}
        <span
          className="font-mono hidden sm:block"
          style={{
            fontSize: 9,
            letterSpacing: "0.22em",
            color: "rgba(255,255,255,0.18)",
            textTransform: "uppercase",
          }}
          aria-hidden="true"
        >
          Visual Archive
        </span>
      </div>
    </header>
  );
}
