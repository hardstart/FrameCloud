"use client";

import { forwardRef, InputHTMLAttributes } from "react";

interface PasswordInputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ error, className = "", ...props }, ref) => {
    return (
      <input
        ref={ref}
        type="password"
        className={`
          w-full bg-transparent border font-mono text-xs text-center
          py-2 px-3 outline-none uppercase tracking-wider
          ${className}
        `}
        style={{
          borderColor: error ? "var(--accent-red)" : "rgba(255, 184, 0, 0.4)",
          color: "var(--lcd-amber)",
          caretColor: "var(--lcd-amber)",
        }}
        autoComplete="off"
        spellCheck={false}
        {...props}
      />
    );
  }
);

PasswordInput.displayName = "PasswordInput";

export default PasswordInput;
