import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "error" | "maroon" | "outline";
}

export function Badge({ className, variant = "default", children, ...props }: BadgeProps) {
  const variants = {
    default: "bg-zinc-800/60 text-zinc-300 border-zinc-700/50",
    success: "bg-emerald-950/50 text-emerald-300 border-emerald-800/40",
    warning: "bg-amber-950/50 text-amber-300 border-amber-800/40",
    error: "bg-red-950/50 text-red-300 border-red-800/40",
    maroon: "bg-maroon-950/70 text-maroon-300 border-maroon-800/50",
    outline: "bg-transparent text-zinc-400 border-white/10",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium font-body border",
        variants[variant] || variants.default,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
