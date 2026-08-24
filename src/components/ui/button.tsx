"use client";

import React, { forwardRef } from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center font-heading font-medium tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080808] disabled:opacity-50 disabled:pointer-events-none select-none rounded-xl",
  {
    variants: {
      variant: {
        primary:
          "bg-[#800020] hover:bg-[#9b1b30] text-white shadow-[0_0_20px_-3px_rgba(128,0,32,0.4)] border border-maroon-700/40 active:bg-maroon-800",
        secondary:
          "bg-[#1A1A1A] hover:bg-[#222222] text-white border border-white/10 active:bg-[#151515]",
        outline:
          "bg-transparent border border-white/10 text-zinc-300 hover:text-white hover:bg-white/5 hover:border-white/20",
        ghost:
          "bg-transparent text-zinc-400 hover:text-white hover:bg-white/5",
        danger:
          "bg-red-950/40 border border-red-800/40 text-red-300 hover:bg-red-900/50 hover:text-red-200",
        glass:
          "glass-panel text-white hover:bg-white/10 hover:border-white/15",
      },
      size: {
        sm: "h-8 px-3 text-xs gap-1.5 rounded-lg",
        md: "h-10 px-4 text-sm gap-2 rounded-xl",
        lg: "h-12 px-6 text-base gap-2.5 rounded-xl",
        icon: "h-9 w-9 p-0 flex items-center justify-center rounded-lg",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends Omit<HTMLMotionProps<"button">, "size" | "children">,
    VariantProps<typeof buttonVariants> {
  children?: React.ReactNode;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
        disabled={disabled || isLoading}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </motion.button>
    );
  }
);

Button.displayName = "Button";
