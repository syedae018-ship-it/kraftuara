"use client";

import React, { useState } from "react";
import { AppearanceSettings, CuratedPaletteId, ThemeColors, ThemeTokens } from "@/types/theme";
import { Input } from "@/components/ui/input";
import {
  CURATED_PALETTES_LIST,
  CURATED_PALETTES,
  DEFAULT_PALETTE_ID,
} from "@/lib/theme-palettes";
import { resolveThemeTokens } from "@/lib/theme-token-resolver";
import { normalizeHex } from "@/lib/color-utils";
import { Palette, Check, RotateCcw, AlertTriangle, Sparkles, ChevronDown, ChevronUp, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ColorPickerProps {
  settings?: AppearanceSettings;
  colors?: ThemeColors;
  onChange: (updated: Partial<AppearanceSettings>) => void;
  className?: string;
}


interface ColorControlItem {
  key: keyof ThemeTokens;
  label: string;
  category: string;
  description: string;
  legacyColorKey?: keyof ThemeColors;
}

const COLOR_CONTROLS: ColorControlItem[] = [
  {
    key: "primary",
    label: "Primary Accent",
    category: "Brand & Identity",
    description: "Main brand color used for primary buttons, active controls, links, and important interactive elements.",
    legacyColorKey: "primary",
  },
  {
    key: "secondary",
    label: "Secondary Accent",
    category: "Brand & Identity",
    description: "Secondary brand color used for secondary buttons, subtle surfaces, and supporting highlights.",
    legacyColorKey: "secondary",
  },
  {
    key: "accent",
    label: "Highlight / Accent",
    category: "Brand & Identity",
    description: "Used for promotional highlights, badges, discount pills, and special attention elements.",
    legacyColorKey: "accent",
  },
  {
    key: "background",
    label: "Storefront Background",
    category: "Layout & Surfaces",
    description: "Main background color of the storefront pages and container areas.",
    legacyColorKey: "background",
  },
  {
    key: "surface",
    label: "Surface & Cards",
    category: "Layout & Surfaces",
    description: "Background color for product cards, feature boxes, and elevated content panels.",
  },
  {
    key: "textPrimary",
    label: "Text Primary (Headings)",
    category: "Typography",
    description: "Main headings, product titles, section titles, and high-emphasis text.",
  },
  {
    key: "textSecondary",
    label: "Text Secondary (Body)",
    category: "Typography",
    description: "Supporting descriptions, category metadata, subtitles, and secondary info.",
  },
  {
    key: "cta",
    label: "CTA Color (Buy / Action)",
    category: "Commerce Buttons",
    description: "Main high-conversion action buttons such as Buy Now, Shop Now, and Checkout.",
  },
  {
    key: "addToCart",
    label: "Add to Cart Color",
    category: "Commerce Buttons",
    description: "Product card and product detail Add to Cart button background.",
  },
  {
    key: "price",
    label: "Price Color",
    category: "Commerce Pricing",
    description: "Product price displayed on product cards, quick view modals, and product details.",
  },
];

export function ColorPicker({ settings, colors, onChange, className }: ColorPickerProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [hexErrors, setHexErrors] = useState<Record<string, string>>({});

  // Resolve current theme tokens using master single-source-of-truth resolver
  const resolved = resolveThemeTokens(settings || { colors });
  const activePaletteId = (settings?.paletteId as CuratedPaletteId) || resolved.paletteId || DEFAULT_PALETTE_ID;
  const customOverrides = settings?.customOverrides || {};
  const hasCustomOverrides = Object.keys(customOverrides).length > 0;

  // Handle Palette Selection
  const handleSelectPalette = (paletteId: CuratedPaletteId) => {
    const chosen = CURATED_PALETTES[paletteId];
    if (!chosen) return;

    if (settings) {
      onChange({
        paletteId,
        customOverrides: {},
        colors: {
          primary: chosen.tokens.primary,
          secondary: chosen.tokens.secondary,
          accent: chosen.tokens.accent,
          background: chosen.tokens.background,
        },
        tokens: chosen.tokens,
      });
    } else {
      onChange({
        paletteId,
        colors: {
          primary: chosen.tokens.primary,
          secondary: chosen.tokens.secondary,
          accent: chosen.tokens.accent,
          background: chosen.tokens.background,
        },
        tokens: chosen.tokens,
      });
    }
  };

  // Handle Single Token Override
  const handleTokenChange = (key: keyof ThemeTokens, value: string, legacyKey?: keyof ThemeColors) => {
    const cleanHex = normalizeHex(value, resolved.tokens[key]);

    // Validation
    const isValid = /^#[0-9A-Fa-f]{6}$/.test(cleanHex);
    if (!isValid && value.length >= 4) {
      setHexErrors((prev) => ({ ...prev, [key]: "Invalid hex color" }));
    } else {
      setHexErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }

    const updatedOverrides = {
      ...(settings?.customOverrides || {}),
      [key]: cleanHex,
    };

    const updatedTokens: ThemeTokens = {
      ...resolved.tokens,
      [key]: cleanHex,
    };

    const updatedColors: ThemeColors = {
      primary: key === "primary" ? cleanHex : (settings?.colors?.primary || resolved.tokens.primary),
      secondary: key === "secondary" ? cleanHex : (settings?.colors?.secondary || resolved.tokens.secondary),
      accent: key === "accent" ? cleanHex : (settings?.colors?.accent || resolved.tokens.accent),
      background: key === "background" ? cleanHex : (settings?.colors?.background || resolved.tokens.background),
    };

    onChange({
      paletteId: activePaletteId,
      customOverrides: updatedOverrides,
      tokens: updatedTokens,
      colors: updatedColors,
    });
  };


  // Reset to Active Palette Defaults
  const handleResetToPalette = () => {
    handleSelectPalette(activePaletteId);
  };

  // Check for critical low-contrast issues
  const criticalContrastIssues = resolved.contrastIssues.filter((i) => !i.isSufficient);

  return (
    <div className={cn("space-y-5 pt-1", className)}>
      {/* Header Info */}
      <div className="space-y-1">
        <label className="text-xs font-bold text-white font-heading tracking-wide flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-maroon-400" /> Curated Store Themes
        </label>
        <p className="text-[11px] text-zinc-400 font-body leading-relaxed">
          Select a professionally designed theme system. Each palette automatically configures all buttons, pricing, surfaces, and high-contrast typography.
        </p>
      </div>

      {/* 4 Curated Palettes Selector */}
      <div className="space-y-2.5">
        <div className="grid grid-cols-1 gap-2.5">
          {CURATED_PALETTES_LIST.map((palette) => {
            const isSelected = activePaletteId === palette.id;
            return (
              <button
                key={palette.id}
                type="button"
                onClick={() => handleSelectPalette(palette.id)}
                className={cn(
                  "relative w-full p-3 rounded-2xl text-left transition-all border flex flex-col gap-2 group",
                  isSelected
                    ? "bg-gradient-to-r from-[#1E1215] to-[#151515] border-maroon-600 shadow-md ring-1 ring-maroon-600/50"
                    : "bg-[#141414] border-white/10 hover:border-white/20 hover:bg-[#181818]"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold font-heading text-white tracking-tight">
                      {palette.name}
                    </span>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-zinc-400 font-body font-medium">
                      {palette.style}
                    </span>
                  </div>
                  {isSelected ? (
                    <div className="flex items-center gap-1 text-maroon-400 text-[10px] font-bold font-heading bg-maroon-950/80 px-2 py-0.5 rounded-full border border-maroon-700/50">
                      <Check className="w-3 h-3" /> Active
                    </div>
                  ) : (
                    <span className="text-[10px] text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity font-body">
                      Apply
                    </span>
                  )}
                </div>

                <p className="text-[10px] text-zinc-400 font-body line-clamp-1">
                  {palette.description}
                </p>

                {/* 4-Color Swatch Bar */}
                <div className="flex items-center justify-between pt-1 border-t border-white/5">
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-4 h-4 rounded-md border border-white/20 shadow-sm"
                      style={{ backgroundColor: palette.previewSwatches.background }}
                      title={`Background: ${palette.previewSwatches.background}`}
                    />
                    <div
                      className="w-4 h-4 rounded-md border border-white/20 shadow-sm"
                      style={{ backgroundColor: palette.previewSwatches.primary }}
                      title={`Primary: ${palette.previewSwatches.primary}`}
                    />
                    <div
                      className="w-4 h-4 rounded-md border border-white/20 shadow-sm"
                      style={{ backgroundColor: palette.previewSwatches.accent }}
                      title={`Accent: ${palette.previewSwatches.accent}`}
                    />
                    <div
                      className="w-4 h-4 rounded-md border border-white/20 shadow-sm"
                      style={{ backgroundColor: palette.previewSwatches.cta }}
                      title={`CTA: ${palette.previewSwatches.cta}`}
                    />
                  </div>
                  <span className="text-[9px] text-zinc-500 font-mono">
                    {palette.bestFor}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Reset to Palette Defaults */}
        {hasCustomOverrides && (
          <div className="pt-1 flex items-center justify-between bg-maroon-950/40 border border-maroon-800/40 rounded-xl p-2.5">
            <div className="text-[10px] text-zinc-300 font-body">
              <span className="font-semibold text-white">Custom colors active.</span> Restore original {CURATED_PALETTES[activePaletteId]?.name} tokens?
            </div>
            <button
              type="button"
              onClick={handleResetToPalette}
              className="px-2.5 py-1 text-[10px] font-bold font-heading text-maroon-300 bg-maroon-900/60 hover:bg-maroon-800/80 border border-maroon-600/50 rounded-lg flex items-center gap-1 transition-colors shrink-0"
            >
              <RotateCcw className="w-3 h-3" /> Reset Palette
            </button>
          </div>
        )}
      </div>

      {/* Live Contrast Safety Notice */}
      {criticalContrastIssues.length > 0 ? (
        <div className="p-3 bg-amber-950/50 border border-amber-700/50 rounded-xl space-y-1 text-[11px] text-amber-200">
          <div className="flex items-center gap-1.5 font-bold font-heading text-amber-400 text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0" /> Low Contrast Warning
          </div>
          <p className="text-[10px] text-amber-300 leading-relaxed font-body">
            Some custom color combinations have low contrast. The storefront engine has automatically calculated high-contrast foreground text to guarantee visibility.
          </p>
        </div>
      ) : (
        <div className="p-2.5 bg-emerald-950/30 border border-emerald-800/30 rounded-xl flex items-center gap-2 text-[10px] text-emerald-300 font-body">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>All button and text colors meet WCAG contrast readability standards.</span>
        </div>
      )}

      {/* Manual Color Customizer Section */}
      <div className="pt-2 border-t border-white/10 space-y-3">
        <button
          type="button"
          onClick={() => setShowAdvanced((prev) => !prev)}
          className="w-full flex items-center justify-between p-2.5 bg-[#141414] hover:bg-[#181818] border border-white/10 rounded-xl text-left transition-colors"
        >
          <div className="flex items-center gap-2">
            <Palette className="w-3.5 h-3.5 text-maroon-400" />
            <span className="text-xs font-bold font-heading text-white">
              Fine-Tune Individual Colors
            </span>
          </div>
          {showAdvanced ? (
            <ChevronUp className="w-3.5 h-3.5 text-zinc-400" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
          )}
        </button>

        {showAdvanced && (
          <div className="space-y-4 pt-1 animate-in fade-in duration-200">
            <p className="text-[10px] text-zinc-400 font-body leading-relaxed">
              Customize specific elements independently. Changing one color will never break unrelated buttons or make prices invisible.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {COLOR_CONTROLS.map((control) => {
                const currentColor = resolved.tokens[control.key] || "#000000";
                const hasError = !!hexErrors[control.key];

                return (
                  <div
                    key={control.key}
                    className="p-3 bg-[#131313] border border-white/10 rounded-xl space-y-2 flex flex-col justify-between"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold font-heading text-white">
                          {control.label}
                        </span>
                        <span className="text-[8px] font-mono uppercase px-1.5 py-0.5 bg-white/5 rounded text-zinc-500">
                          {control.category}
                        </span>
                      </div>
                      <p className="text-[9px] text-zinc-400 font-body leading-tight line-clamp-2">
                        {control.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="color"
                        value={currentColor}
                        onChange={(e) =>
                          handleTokenChange(control.key, e.target.value, control.legacyColorKey)
                        }
                        className="w-8 h-8 rounded-lg border border-white/20 bg-transparent cursor-pointer p-0 shrink-0"
                      />
                      <div className="flex-1">
                        <Input
                          value={currentColor}
                          onChange={(e) =>
                            handleTokenChange(control.key, e.target.value, control.legacyColorKey)
                          }
                          placeholder="#000000"
                          className={cn(
                            "font-mono text-xs h-8 uppercase bg-[#0A0A0A]",
                            hasError && "border-red-500"
                          )}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
