"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ShoppingBag,
  Sliders,
  ChevronDown,
  Sparkles,
  Store,
} from "lucide-react";
import { useDemo, ThemePresetKey } from "@/context/demo-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export function DemoTopBar() {
  const router = useRouter();
  const { theme } = useParams() as { theme?: string };
  const {
    cartItemCount,
    setCartOpen,
    setCustomizationOpen,
    themeConfig,
    resetThemeConfig,
  } = useDemo();

  const [dropdownOpen, setDropdownOpen] = useState(false);

  const themeDisplayNames: Record<string, string> = {
    luxury: "Luxury Oud",
    modern: "Modern Store",
    creative: "Creative Store",
  };

  const activeThemeName =
    themeDisplayNames[theme || ""] ||
    themeDisplayNames[themeConfig.preset] ||
    "Live Store";

  const handleSelectTheme = (newTheme: ThemePresetKey) => {
    setDropdownOpen(false);
    resetThemeConfig(newTheme);
    router.push(`/demo/${newTheme}`);
  };

  return (
    <div className="sticky top-0 z-40 w-full bg-[#0a0a0b]/90 backdrop-blur-md border-b border-white/10 px-4 py-2 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xl font-body">
      {/* Left Column: Live Status */}
      <div className="flex items-center gap-2.5">
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <Badge variant="maroon" className="text-[10px] py-0.5 uppercase tracking-wider font-mono">
          Live Interactive Demo
        </Badge>
        <p className="text-xs text-zinc-300 font-body hidden md:block">
          Active Store Preset: <strong className="text-white">{activeThemeName}</strong>
        </p>
      </div>

      {/* Right Column: Template Switcher & Actions */}
      <div className="flex items-center gap-2.5">
        {/* Template Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="h-8 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold font-heading text-white flex items-center gap-1.5 transition-all"
          >
            <Store className="w-3.5 h-3.5 text-maroon-400" />
            <span>Choose Another Template</span>
            <ChevronDown className={cn("w-3.5 h-3.5 text-zinc-400 transition-transform", dropdownOpen && "rotate-180")} />
          </button>

          {dropdownOpen && (
            <>
              <div
                onClick={() => setDropdownOpen(false)}
                className="fixed inset-0 z-40"
              />
              <div className="absolute right-0 top-10 z-50 w-52 bg-[#151515] border border-white/10 rounded-2xl shadow-2xl p-1.5 space-y-1 backdrop-blur-xl">
                {[
                  { id: "luxury", label: "Luxury Oud", tag: "Perfumes & Gold" },
                  { id: "modern", label: "Modern Store", tag: "Electronics & Tech" },
                  { id: "creative", label: "Creative Store", tag: "Fashion & Lifestyle" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTheme(item.id as ThemePresetKey)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-xl text-xs flex flex-col gap-0.5 transition-colors",
                      (theme === item.id || themeConfig.preset === item.id)
                        ? "bg-maroon-800/80 text-white font-bold"
                        : "text-zinc-300 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <span className="font-heading font-bold">{item.label}</span>
                    <span className="text-[10px] text-zinc-400 font-mono">{item.tag}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Live Customization Drawer Trigger */}
        <button
          onClick={() => setCustomizationOpen(true)}
          className="h-8 px-3 rounded-xl bg-maroon-900/60 hover:bg-maroon-800 border border-maroon-600/40 text-xs font-semibold font-heading text-white flex items-center gap-1.5 transition-all shadow-glow"
          title="Customize Theme"
        >
          <Sliders className="w-3.5 h-3.5 text-maroon-300" />
          <span className="hidden sm:inline">Customize</span>
        </button>

        {/* Cart Drawer Trigger Button */}
        <button
          onClick={() => setCartOpen(true)}
          className="relative p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-colors"
          title="View Shopping Cart"
        >
          <ShoppingBag className="w-4 h-4 text-white" />
          {cartItemCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-maroon-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center font-mono shadow-glow">
              {cartItemCount}
            </span>
          )}
        </button>

        {/* Back to Landing */}
        <Link href="/">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs font-semibold border-white/10 hover:bg-white/5"
            leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
          >
            Back to Landing
          </Button>
        </Link>
      </div>
    </div>
  );
}
