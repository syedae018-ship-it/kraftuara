import React, { forwardRef, useId, useState } from "react";
import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";

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
    const [showPassword, setShowPassword] = useState(false);

    const isPasswordType = type === "password";
    const inputType = isPasswordType ? (showPassword ? "text" : "password") : type;

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
            type={inputType}
            id={inputId}
            ref={ref}
            disabled={disabled}
            className={cn(
              "w-full h-10 bg-[#111111] border border-white/10 rounded-xl px-3.5 text-sm text-white font-body placeholder:text-zinc-600 outline-none transition-all duration-150",
              "hover:border-white/20 focus:border-maroon-700/70 focus:ring-2 focus:ring-maroon-700/20 focus:bg-[#151515]",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-white/10",
              leftIcon && "pl-10",
              (rightIcon || isPasswordType) && "pr-10",
              error && "border-red-500/60 focus:border-red-500 focus:ring-red-500/20",
              className
            )}
            {...props}
          />
          {isPasswordType ? (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 text-zinc-500 hover:text-zinc-300 transition-colors shrink-0 flex items-center justify-center select-none cursor-pointer"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          ) : rightIcon ? (
            <div className="absolute right-3.5 text-zinc-500 shrink-0 flex items-center justify-center">
              {rightIcon}
            </div>
          ) : null}
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
