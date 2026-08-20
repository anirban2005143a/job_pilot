"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "contained" | "outline" | "ghost";
  startIcon?: ReactNode;
  endIcon?: ReactNode;
};

export function Button({
  variant = "default",
  startIcon,
  endIcon,
  className = "",
  children,
  ...props
}: ButtonProps) {
  const styles =
    variant === "contained" || variant === "default"
      ? "bg-[#2563eb] text-white hover:bg-[#1d4ed8]"
      : variant === "outline"
        ? "border border-[#dbeafe] bg-white text-[#172554] hover:bg-[#eff6ff]"
        : "bg-transparent text-[#2563eb] hover:bg-[#eff6ff]";
  return (
    <button
      className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${styles} ${className}`}
      {...props}
    >
      {startIcon}
      {children}
      {endIcon}
    </button>
  );
}
