"use client";

import React from "react";
import {
  Sliders,
  X,
  Palette,
  Type,
  Maximize2,
  Sparkles,
  RotateCcw,
  Sun,
  Moon,
  Check,
} from "lucide-react";
import {
  useDemo,
  ThemePresetKey,
  TypographyPresetKey,
  BorderRadiusKey,
  ButtonStyleKey,
  LayoutWidthKey,
} from "@/context/demo-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export function LiveCustomizationPanel() {
  const {
    themeConfig,
    updateThemeConfig,
    resetThemeConfig,
    customizationOpen,
    setCustomizationOpen,
  } = useDemo();

  return (
    <>
      {/* Floating Right Trigger Button */}
      <button
        onClick={() => setCustomizationOpen(!customizationOpen)}
        className="fixed right-0 top-1/3 z-40 bg-gradient-to-l from-maroon-800 to-maroon-950 text-white p-3 rounded-l-2xl shadow-2xl border-l border-y border-maroon-500/40 hover:pl-4 transition-all flex flex-col items-center gap-1.5 group cursor-pointer"
        title="Live Customization Engine"
      >
        <Sliders className="w-5 h-5 text-maroon-300 group-hover:rotate-45 transition-transform" />
        <span className="text-[10px] font-bold uppercase tracking-widest font-heading [writing-mode:vertical-lr] rotate-180 text-zinc-200">
          Live Customization
        </span>
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping mt-1" />
      </button>

      {/* Backdrop */}
      {customizationOpen && (
        <div
          onClick={() => setCustomizationOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity"
        />
      )}

      {/* Slide-over Drawer Panel */}
      <div
        className={cn(
          "fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm bg-[#111111] border-l border-white/10 text-white p-6 shadow-2xl overflow-y-auto font-body transition-transform duration-300 flex flex-col justify-between",
          customizationOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-maroon-900/60 border border-maroon-600/40 text-maroon-300">
                  <Palette className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold font-heading text-white">
                  Live Customization
                </h3>
              </div>
              <p className="text-[11px] text-zinc-400">
                Demonstrating real-time storefront engine flexibility
              </p>
            </div>
            <button
              onClick={() => setCustomizationOpen(false)}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors border border-transparent hover:border-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 1. Theme Presets */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-maroon-400 font-heading block">
              Theme Presets
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["luxury", "modern", "creative"] as ThemePresetKey[]).map(
                (preset) => {
                  const isSelected = themeConfig.preset === preset;
                  return (
                    <button
                      key={preset}
                      onClick={() => resetThemeConfig(preset)}
                      className={cn(
                        "py-2 px-2 rounded-xl text-xs font-semibold uppercase tracking-wider font-heading border transition-all flex flex-col items-center gap-1",
                        isSelected
                          ? "bg-maroon-800/90 border-maroon-500 text-white shadow-glow"
                          : "bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:bg-white/10"
                      )}
                    >
                      {preset}
                      {isSelected && <Check className="w-3 h-3 text-emerald-400" />}
                    </button>
                  );
                }
              )}
            </div>
          </div>

          {/* 2. Light / Dark Mode Toggle */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-maroon-400 font-heading block">
              Mode / Appearance
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => updateThemeConfig({ mode: "dark" })}
                className={cn(
                  "py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-2 transition-all",
                  themeConfig.mode === "dark"
                    ? "bg-maroon-800/90 border-maroon-500 text-white shadow-glow"
                    : "bg-white/5 border-white/10 text-zinc-400 hover:text-white"
                )}
              >
                <Moon className="w-3.5 h-3.5" /> Dark Mode
              </button>
              <button
                onClick={() => updateThemeConfig({ mode: "light" })}
                className={cn(
                  "py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-2 transition-all",
                  themeConfig.mode === "light"
                    ? "bg-white text-zinc-950 border-white shadow-glow font-bold"
                    : "bg-white/5 border-white/10 text-zinc-400 hover:text-white"
                )}
              >
                <Sun className="w-3.5 h-3.5 text-amber-500" /> Light Mode
              </button>
            </div>
          </div>

          {/* 3. Custom Color Pickers */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-maroon-400 font-heading block">
              Color Palette
            </label>
            <div className="space-y-2">
              <div className="flex items-center justify-between bg-white/5 p-2 rounded-xl border border-white/5">
                <span className="text-xs text-zinc-300">Primary Color</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={themeConfig.primaryColor}
                    onChange={(e) =>
                      updateThemeConfig({ primaryColor: e.target.value })
                    }
                    className="w-6 h-6 rounded border-0 cursor-pointer bg-transparent"
                  />
                  <span className="text-[11px] font-mono text-zinc-400 uppercase">
                    {themeConfig.primaryColor}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between bg-white/5 p-2 rounded-xl border border-white/5">
                <span className="text-xs text-zinc-300">Secondary Color</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={themeConfig.secondaryColor}
                    onChange={(e) =>
                      updateThemeConfig({ secondaryColor: e.target.value })
                    }
                    className="w-6 h-6 rounded border-0 cursor-pointer bg-transparent"
                  />
                  <span className="text-[11px] font-mono text-zinc-400 uppercase">
                    {themeConfig.secondaryColor}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between bg-white/5 p-2 rounded-xl border border-white/5">
                <span className="text-xs text-zinc-300">Accent Color</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={themeConfig.accentColor}
                    onChange={(e) =>
                      updateThemeConfig({ accentColor: e.target.value })
                    }
                    className="w-6 h-6 rounded border-0 cursor-pointer bg-transparent"
                  />
                  <span className="text-[11px] font-mono text-zinc-400 uppercase">
                    {themeConfig.accentColor}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Typography Presets */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-maroon-400 font-heading block">
              Typography Style
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "serif_luxury", label: "Serif Luxury" },
                { id: "modern_sans", label: "Modern Sans" },
                { id: "editorial_italic", label: "Editorial Italic" },
                { id: "mono_code", label: "Monospace" },
              ].map((font) => (
                <button
                  key={font.id}
                  onClick={() =>
                    updateThemeConfig({
                      typography: font.id as TypographyPresetKey,
                    })
                  }
                  className={cn(
                    "py-2 px-2 rounded-xl text-[11px] font-medium border text-center transition-all",
                    themeConfig.typography === font.id
                      ? "bg-maroon-800/90 border-maroon-500 text-white font-bold"
                      : "bg-white/5 border-white/10 text-zinc-400 hover:text-white"
                  )}
                >
                  {font.label}
                </button>
              ))}
            </div>
          </div>

          {/* 5. Border Radius */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-maroon-400 font-heading block">
              Border Radius
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {(["none", "soft", "rounded", "full"] as BorderRadiusKey[]).map(
                (r) => (
                  <button
                    key={r}
                    onClick={() => updateThemeConfig({ borderRadius: r })}
                    className={cn(
                      "py-1.5 px-1 rounded-lg text-[10px] font-mono uppercase tracking-wider border text-center transition-all",
                      themeConfig.borderRadius === r
                        ? "bg-maroon-800/90 border-maroon-500 text-white font-bold"
                        : "bg-white/5 border-white/10 text-zinc-400 hover:text-white"
                    )}
                  >
                    {r}
                  </button>
                )
              )}
            </div>
          </div>

          {/* 6. Button Style */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-maroon-400 font-heading block">
              Button Components
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {(["pill", "rounded", "sharp", "outline"] as ButtonStyleKey[]).map(
                (btn) => (
                  <button
                    key={btn}
                    onClick={() => updateThemeConfig({ buttonStyle: btn })}
                    className={cn(
                      "py-1.5 px-1 rounded-lg text-[10px] font-mono uppercase tracking-wider border text-center transition-all",
                      themeConfig.buttonStyle === btn
                        ? "bg-maroon-800/90 border-maroon-500 text-white font-bold"
                        : "bg-white/5 border-white/10 text-zinc-400 hover:text-white"
                    )}
                  >
                    {btn}
                  </button>
                )
              )}
            </div>
          </div>

          {/* 7. Store Name / Logo Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-maroon-400 font-heading block">
              Store Name Header
            </label>
            <Input
              value={themeConfig.storeTitle}
              onChange={(e) => updateThemeConfig({ storeTitle: e.target.value })}
              placeholder="e.g. Aroma Perfumes"
              className="h-9 text-xs"
            />
          </div>

          {/* 8. Layout Width */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-maroon-400 font-heading block">
              Layout Container Width
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["container", "full", "compact"] as LayoutWidthKey[]).map(
                (w) => (
                  <button
                    key={w}
                    onClick={() => updateThemeConfig({ layoutWidth: w })}
                    className={cn(
                      "py-1.5 px-2 rounded-xl text-[11px] font-semibold uppercase border text-center transition-all",
                      themeConfig.layoutWidth === w
                        ? "bg-maroon-800/90 border-maroon-500 text-white font-bold"
                        : "bg-white/5 border-white/10 text-zinc-400 hover:text-white"
                    )}
                  >
                    {w}
                  </button>
                )
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-6 border-t border-white/10 space-y-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => resetThemeConfig(themeConfig.preset)}
            className="w-full justify-center text-xs h-9 border-white/10"
            leftIcon={<RotateCcw className="w-3.5 h-3.5 text-zinc-400" />}
          >
            Reset Preset Defaults
          </Button>
        </div>
      </div>
    </>
  );
}
