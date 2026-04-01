"use client";

interface ShutterBlinkProps {
  active: boolean;
}

export default function ShutterBlink({ active }: ShutterBlinkProps) {
  return (
    <div
      className="absolute inset-0 z-40 bg-black pointer-events-none"
      style={{
        opacity: active ? 1 : 0,
        transition: active
          ? "opacity 40ms ease-in"
          : "opacity 60ms ease-out",
      }}
    />
  );
}
