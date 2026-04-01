"use client";

interface LoadingBarProps {
  progress: number;
  width?: string;
}

export default function LoadingBar({ progress, width = "160px" }: LoadingBarProps) {
  return (
    <div
      className="h-1 overflow-hidden"
      style={{
        width,
        backgroundColor: "rgba(255, 184, 0, 0.2)",
      }}
    >
      <div
        className="h-full transition-all duration-200"
        style={{
          width: `${Math.min(progress, 100)}%`,
          backgroundColor: "var(--lcd-amber)",
        }}
      />
    </div>
  );
}
