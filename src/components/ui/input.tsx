"use client";

import React, { forwardRef, useId } from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = "text",
      label,
      helperText,
      error,
      leftIcon,
      rightIcon,
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold text-zinc-300 font-heading tracking-wide"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 text-zinc-500 pointer-events-none shrink-0 flex items-center justify-center">
              {leftIcon}
            </div>
          )}
          <input
            type={type}
            id={inputId}
            ref={ref}
            disabled={disabled}
            className={cn(
              "w-full h-10 bg-[#111111] border border-white/10 rounded-xl px-3.5 text-sm text-white font-body placeholder:text-zinc-600 outline-none transition-all duration-150",
              "hover:border-white/20 focus:border-maroon-700/70 focus:ring-2 focus:ring-maroon-700/20 focus:bg-[#151515]",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-white/10",
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              error && "border-red-500/60 focus:border-red-500 focus:ring-red-500/20",
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3.5 text-zinc-500 shrink-0 flex items-center justify-center">
              {rightIcon}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-xs text-red-400 font-body">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-zinc-500 font-body">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
