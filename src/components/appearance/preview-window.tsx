"use client";

import React, { useState } from "react";
import { AppearanceSettings } from "@/types/theme";
import { Product, initialProducts, initialCategories } from "@/types/product";
import { Category } from "@/types/category";
import { StoreData } from "@/types/store";
import { CartProvider } from "@/context/CartContext";
import BloomStorefront from "@/components/storefront/templates/bloom/home/BloomStorefront";
import { StoreRenderer } from "@/components/storefront/store-renderer";
import { Button } from "@/components/ui/button";
import {
  Monitor,
  Tablet,
  Smartphone,
  Undo2,
  Redo2,
  RotateCcw,
  Save,
  Lock,
  Wifi,
  BatteryMedium,
  ZoomIn,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";
import {
  ResponsiveViewportFrame,
  DeviceType,
  DEVICE_VIEWPORTS,
} from "./responsive-viewport-frame";

const sampleFallbackCategories: Category[] = initialCategories.map((c, idx) => ({
  id: c.id,
  name: c.name,
  slug: c.slug,
  displayOrder: idx,
  status: "published" as const,
  productCount: c.itemCount,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}));

export interface PreviewWindowProps {
  settings: AppearanceSettings;
  onUndo: () => void;
  onRedo: () => void;
  onReset: () => void;
  onSave: () => void;
  canUndo: boolean;
  canRedo: boolean;
  isSaving?: boolean;
  className?: string;
  categories?: Category[];
  products?: Product[];
}

export function PreviewWindow({
  settings,
  onUndo,
  onRedo,
  onReset,
  onSave,
  canUndo,
  canRedo,
  isSaving = false,
  className,
  categories = [],
  products = [],
}: PreviewWindowProps) {
  const { activeStore } = useAuth();
  const [device, setDevice] = useState<DeviceType>("desktop");
  const [zoom, setZoom] = useState<"auto" | number>("auto");
  const [currentScale, setCurrentScale] = useState(1);

  // Construct authoritative StoreData for the real storefront renderer
  const previewStoreData: StoreData = {
    id: activeStore?.id || "preview-store",
    name: settings.branding?.name || activeStore?.name || "My Store",
    slug: activeStore?.slug || "my-store",
    plan: activeStore?.plan || "startup",
    appearance: settings,
    categories: categories.length > 0 ? categories : sampleFallbackCategories,
    collections: [],
    products: products.length > 0 ? products : initialProducts,
    shipping: {
      freeShippingEnabled: true,
      freeShippingThreshold: 500,
    },
  };

  const themeId = settings.themeId || "bloom";

  return (
    <div className={cn("flex-1 flex flex-col h-full bg-[#080808] overflow-hidden", className)}>
      {/* Top Toolbar */}
      <div className="h-14 bg-[#111111] border-b border-white/10 px-3 sm:px-4 flex items-center justify-between shrink-0 z-20 gap-2">
        {/* Undo / Redo / Reset */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 sm:p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-30 border border-transparent hover:border-white/10"
            title="Undo (Cmd+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 sm:p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-30 border border-transparent hover:border-white/10"
            title="Redo (Cmd+Shift+Z)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onReset}
            className="p-1.5 sm:p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors border border-transparent hover:border-white/10"
            title="Reset to Defaults"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <span className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/40 text-[10px] font-mono text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Auto-published & Live
          </span>
        </div>

        {/* Center: Device Viewport Switcher & Dimension Indicator */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#151515] border border-white/10 rounded-xl p-1 shrink-0">
            <button
              type="button"
              onClick={() => setDevice("desktop")}
              className={cn(
                "px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1.5 font-heading font-medium",
                device === "desktop"
                  ? "bg-maroon-800 text-white shadow-glow"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              )}
              title="Desktop Viewport (1440px)"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Desktop</span>
            </button>
            <button
              type="button"
              onClick={() => setDevice("tablet")}
              className={cn(
                "px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1.5 font-heading font-medium",
                device === "tablet"
                  ? "bg-maroon-800 text-white shadow-glow"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              )}
              title="Tablet Viewport (768px)"
            >
              <Tablet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tablet</span>
            </button>
            <button
              type="button"
              onClick={() => setDevice("mobile")}
              className={cn(
                "px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1.5 font-heading font-medium",
                device === "mobile"
                  ? "bg-maroon-800 text-white shadow-glow"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              )}
              title="Mobile Viewport (390px)"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mobile</span>
            </button>
          </div>

          {/* Viewport Dimension Tag & Zoom Selector */}
          <div className="hidden lg:flex items-center gap-1.5 bg-[#151515] border border-white/10 rounded-xl px-2.5 py-1 text-[11px] font-mono text-zinc-400">
            <span className="text-zinc-300 font-semibold">{DEVICE_VIEWPORTS[device].width}px</span>
            <span className="text-zinc-600">|</span>
            <select
              value={zoom === "auto" ? "auto" : zoom.toString()}
              onChange={(e) => {
                const val = e.target.value;
                setZoom(val === "auto" ? "auto" : parseFloat(val));
              }}
              className="bg-transparent text-zinc-400 hover:text-white outline-none cursor-pointer text-[10px]"
              aria-label="Preview Zoom"
            >
              <option value="auto" className="bg-[#151515] text-white">
                Auto-Fit ({Math.round(currentScale * 100)}%)
              </option>
              <option value="1" className="bg-[#151515] text-white">
                100% Actual
              </option>
              <option value="0.75" className="bg-[#151515] text-white">
                75%
              </option>
              <option value="0.5" className="bg-[#151515] text-white">
                50%
              </option>
            </select>
          </div>
        </div>

        {/* Publish Changes Button */}
        <Button
          variant="primary"
          size="sm"
          onClick={onSave}
          isLoading={isSaving}
          leftIcon={<Save className="w-3.5 h-3.5" />}
          className="text-xs font-bold shrink-0 shadow-glow"
        >
          <span className="hidden sm:inline">Publish Changes</span>
          <span className="sm:hidden">Publish</span>
        </Button>
      </div>

      {/* Real Viewport Simulation Frame Area */}
      <div className="flex-1 overflow-hidden relative">
        <ResponsiveViewportFrame
          device={device}
          zoom={zoom}
          onDimensionsChange={(_, __, s) => setCurrentScale(s)}
          className={cn(
            "flex flex-col bg-black shadow-2xl transition-all duration-300",
            device === "mobile" &&
              "rounded-[44px] border-[8px] border-[#222222] ring-1 ring-white/10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] overflow-hidden",
            device === "tablet" &&
              "rounded-[28px] border-[6px] border-[#222222] ring-1 ring-white/10 shadow-2xl overflow-hidden",
            device === "desktop" &&
              "rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
          )}
        >
          {/* Desktop Browser Top Chrome Bar */}
          {device === "desktop" && (
            <div className="h-9 bg-[#151515] border-b border-white/10 px-4 flex items-center justify-between shrink-0 select-none">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#0a0a0a] border border-white/5 text-[11px] font-mono text-zinc-400 max-w-sm w-full mx-auto justify-center">
                <Lock className="w-2.5 h-2.5 text-emerald-400" />
                <span className="text-zinc-300">{previewStoreData.slug}.kraftaura.com</span>
              </div>
              <div className="w-8" />
            </div>
          )}

          {/* Mobile Simulated Status Bar */}
          {device === "mobile" && (
            <div className="bg-black text-white px-7 pt-3 pb-1 flex justify-between items-center text-[11px] font-semibold tracking-tight select-none shrink-0 border-b border-white/5">
              <span>9:41</span>
              {/* Dynamic Island */}
              <div className="w-24 h-5 bg-[#121212] border border-white/10 rounded-full mx-auto flex items-center justify-end px-2 gap-1.5">
                <div className="w-2 h-2 rounded-full bg-black/80" />
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 animate-pulse" />
              </div>
              <div className="flex items-center gap-1.5 text-white/80">
                <Wifi className="w-3 h-3" />
                <BatteryMedium className="w-3.5 h-3.5" />
              </div>
            </div>
          )}

          {/* Tablet Simulated Status Bar */}
          {device === "tablet" && (
            <div className="bg-black text-white/70 px-6 py-1.5 flex justify-between items-center text-[10px] font-mono select-none shrink-0 border-b border-white/5">
              <span>iPad 9:41 AM</span>
              <div className="w-2 h-2 rounded-full bg-[#222222] border border-white/10" />
              <div className="flex items-center gap-2">
                <Wifi className="w-3 h-3" />
                <span>100%</span>
              </div>
            </div>
          )}

          {/* Storefront Renderer inside Isolated Viewport */}
          <CartProvider storeSlug={previewStoreData.slug}>
            <div className="flex-1 w-full overflow-x-hidden">
              {themeId === "bloom" ||
              themeId === "luxury" ||
              themeId === "modern" ||
              themeId === "creative" ||
              themeId === "luxury-dark" ? (
                <BloomStorefront
                  store={previewStoreData}
                  isSubdomain={false}
                />
              ) : (
                <StoreRenderer
                  store={previewStoreData}
                  isSubdomain={false}
                />
              )}
            </div>
          </CartProvider>

          {/* Mobile Home Bar Indicator */}
          {device === "mobile" && (
            <div className="bg-black py-2 shrink-0 flex justify-center items-center">
              <div className="w-32 h-1 bg-white/40 rounded-full" />
            </div>
          )}
        </ResponsiveViewportFrame>
      </div>
    </div>
  );
}
