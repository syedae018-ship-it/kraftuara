"use client";

import React from "react";
import { TypographyConfig } from "@/types/theme";
import { cn } from "@/lib/utils";

export interface TypographyPickerProps {
  typography: TypographyConfig;
  onChange: (updated: TypographyConfig) => void;
  className?: string;
}

import { SUPPORTED_FONTS, fontStacks, getFontStack } from "@/lib/typography-utils";
export { SUPPORTED_FONTS, fontStacks, getFontStack };


export function TypographyPicker({ typography, onChange, className }: TypographyPickerProps) {
  const headingFont = typography.headingFont || "Helvetica Neue";
  const bodyFont = typography.bodyFont || "Inter";

  return (
    <div className={cn("space-y-4", className)}>
      <div>
        <label className="text-xs font-semibold text-zinc-300 font-heading tracking-wide block">
          Store Typography & Fonts
        </label>
        <span className="text-[11px] text-zinc-500 font-body">
          Configure heading and body fonts independently for your storefront.
        </span>
      </div>

      {/* Heading Font Select */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-zinc-300 font-heading">
          Heading Font
        </label>
        <select
          value={headingFont}
          onChange={(e) => onChange({ ...typography, headingFont: e.target.value })}
          className="w-full bg-[#111111] border border-white/10 text-white rounded-xl p-2.5 text-xs focus:border-maroon-600 outline-none"
        >
          {SUPPORTED_FONTS.map((f) => (
            <option key={f} value={f} style={{ fontFamily: getFontStack(f) }}>
              {f}
            </option>
          ))}
        </select>
      </div>

      {/* Body Font Select */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-zinc-300 font-heading">
          Body Font
        </label>
        <select
          value={bodyFont}
          onChange={(e) => onChange({ ...typography, bodyFont: e.target.value })}
          className="w-full bg-[#111111] border border-white/10 text-white rounded-xl p-2.5 text-xs focus:border-maroon-600 outline-none"
        >
          {SUPPORTED_FONTS.map((f) => (
            <option key={f} value={f} style={{ fontFamily: getFontStack(f) }}>
              {f}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
