"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

interface Props {
  userName: string;
  tenantName: string;
  children: React.ReactNode;
}

export default function DashboardShell({ userName, tenantName, children }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  const navItems = [
    { href: "/dashboard", label: "Albums", exact: true },
  ];

  return (
    <div className="min-h-screen" style={{ background: "#0A0A0A" }}>
      <div className="film-grain-overlay" aria-hidden="true" />

      {/* Top bar */}
      <header
        className="sticky top-0 z-50"
        style={{
          background: "rgba(10,10,10,0.92)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(255,255,255,0.045)",
        }}
      >
        {/* Film strip top */}
        <div
          className="flex items-center gap-[7px] px-6 py-[5px]"
          style={{ background: "#060606", borderBottom: "1px solid rgba(255,255,255,0.03)" }}
          aria-hidden="true"
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: 6, height: 6, borderRadius: "50%",
                background: i === 1 ? "rgba(255,184,0,0.35)" : "rgba(255,255,255,0.07)",
              }}
            />
          ))}
          <span className="font-mono ml-2" style={{ fontSize: 9, color: "rgba(255,184,0,0.25)", letterSpacing: "0.25em" }}>
            FRAMECLOUD 200
          </span>
        </div>

        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-3">
              <span className="font-mono uppercase" style={{ fontSize: 11, letterSpacing: "0.32em", color: "rgba(255,184,0,0.7)" }}>◆</span>
              <span className="font-mono uppercase" style={{ fontSize: 11, letterSpacing: "0.28em", color: "rgba(245,245,245,0.75)" }}>FrameCloud</span>
            </Link>

            <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.06)" }} />

            <nav className="flex items-center gap-4">
              {navItems.map((item) => {
                const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="font-mono uppercase transition-colors"
                    style={{
                      fontSize: 9,
                      letterSpacing: "0.2em",
                      color: active ? "rgba(255,184,0,0.9)" : "rgba(255,255,255,0.35)",
                    }}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2">
              <span className="font-mono" style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>{userName}</span>
              <span className="font-mono" style={{ fontSize: 8, color: "rgba(255,184,0,0.3)" }}>◆</span>
              <span className="font-mono" style={{ fontSize: 9, color: "rgba(255,255,255,0.2)" }}>{tenantName}</span>
            </div>
            <button
              onClick={handleLogout}
              className="font-mono uppercase transition-colors"
              style={{ fontSize: 9, letterSpacing: "0.15em", color: "rgba(255,255,255,0.3)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,68,68,0.8)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="px-6 sm:px-10 lg:px-14 py-10 max-w-[1400px] mx-auto">
        {children}
      </main>
    </div>
  );
}
