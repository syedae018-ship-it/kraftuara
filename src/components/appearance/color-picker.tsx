"use client";

import React from "react";
import { ThemeColors } from "@/types/theme";
import { Input } from "@/components/ui/input";
import { Palette, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ColorPickerProps {
  colors: ThemeColors;
  onChange: (updated: ThemeColors) => void;
  className?: string;
}

const colorPresets = [
  { name: "Palette 1 (Black, White, Maroon)", primary: "#800020", secondary: "#111111", accent: "#ffffff", background: "#080808" },
  { name: "Palette 2 (Beige, Maroon, Cream)", primary: "#800020", secondary: "#f5f2eb", accent: "#faf8f5", background: "#f4efe6" },
  { name: "Palette 3 (Black, Olive Green, White)", primary: "#4a5d36", secondary: "#1a2414", accent: "#ffffff", background: "#0c0f0a" },
  { name: "Palette 4 (Dark Gray, White, Gold)", primary: "#d4af37", secondary: "#27272a", accent: "#ffffff", background: "#1a1a1a" },
];


export function ColorPicker({ colors, onChange, className }: ColorPickerProps) {
  const handleColorChange = (key: keyof ThemeColors, value: string) => {
    onChange({ ...colors, [key]: value });
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div>
        <label className="text-xs font-semibold text-zinc-300 font-heading tracking-wide block">
          Store Theme Colors
        </label>
        <span className="text-[11px] text-zinc-500 font-body">
          Customize primary accents, buttons, background, and highlight elements.
        </span>
      </div>

      {/* Luxury Presets Palette */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-bold font-heading uppercase tracking-widest text-zinc-500">
          Curated Palettes
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {colorPresets.map((preset) => {
            const isSelected = colors.primary === preset.primary;
            return (
              <button
                key={preset.name}
                type="button"
                onClick={() =>
                  onChange({
                    primary: preset.primary,
                    secondary: preset.secondary,
                    accent: preset.accent,
                    background: preset.background,
                  })
                }
                className={cn(
                  "flex items-center justify-between p-2 rounded-xl bg-[#111111] border text-left transition-all",
                  isSelected ? "border-maroon-600 shadow-glow" : "border-white/10 hover:border-white/20"
                )}
              >
                <div className="flex items-center gap-2">
                  <div className="flex items-center -space-x-1.5">
                    <span className="w-4 h-4 rounded-full border border-black" style={{ backgroundColor: preset.primary }} />
                    <span className="w-4 h-4 rounded-full border border-black" style={{ backgroundColor: preset.accent }} />
                  </div>
                  <span className="text-xs text-white font-medium font-body truncate">{preset.name}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-maroon-400" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Manual HEX Inputs */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium text-zinc-400 font-body">Primary Accent</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={colors.primary}
              onChange={(e) => handleColorChange("primary", e.target.value)}
              className="w-8 h-8 rounded-lg border border-white/10 bg-transparent cursor-pointer p-0"
            />
            <Input
              value={colors.primary}
              onChange={(e) => handleColorChange("primary", e.target.value)}
              className="font-mono text-xs h-8"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-medium text-zinc-400 font-body">Secondary Accent</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={colors.secondary}
              onChange={(e) => handleColorChange("secondary", e.target.value)}
              className="w-8 h-8 rounded-lg border border-white/10 bg-transparent cursor-pointer p-0"
            />
            <Input
              value={colors.secondary}
              onChange={(e) => handleColorChange("secondary", e.target.value)}
              className="font-mono text-xs h-8"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-medium text-zinc-400 font-body">Highlight Gold</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={colors.accent}
              onChange={(e) => handleColorChange("accent", e.target.value)}
              className="w-8 h-8 rounded-lg border border-white/10 bg-transparent cursor-pointer p-0"
            />
            <Input
              value={colors.accent}
              onChange={(e) => handleColorChange("accent", e.target.value)}
              className="font-mono text-xs h-8"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-medium text-zinc-400 font-body">Background Surface</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={colors.background}
              onChange={(e) => handleColorChange("background", e.target.value)}
              className="w-8 h-8 rounded-lg border border-white/10 bg-transparent cursor-pointer p-0"
            />
            <Input
              value={colors.background}
              onChange={(e) => handleColorChange("background", e.target.value)}
              className="font-mono text-xs h-8"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
