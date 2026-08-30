"use client";

import React, { useState } from "react";
import { AppearanceSettings } from "@/types/theme";
import { Product, initialProducts, CategoryOption, initialCategories } from "@/types/product";
import { Category } from "@/types/category";
import { StoreData } from "@/types/store";
import { CartProvider } from "@/context/CartContext";
import BloomStorefront from "@/components/storefront/templates/bloom/home/BloomStorefront";
import { Button } from "@/components/ui/button";
import {
  Monitor,
  Tablet,
  Smartphone,
  Undo2,
  Redo2,
  RotateCcw,
  Save,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";

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
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");

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

  return (
    <div className={cn("flex-1 flex flex-col h-full bg-[#080808] overflow-hidden", className)}>
      {/* Top Toolbar */}
      <div className="h-14 bg-[#111111] border-b border-white/10 px-4 flex items-center justify-between shrink-0 z-20">
        {/* Undo / Redo / Reset */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-30 border border-transparent hover:border-white/10"
            title="Undo"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-30 border border-transparent hover:border-white/10"
            title="Redo"
          >
            <Redo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onReset}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors border border-transparent hover:border-white/10"
            title="Reset to Defaults"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/40 text-[10px] font-mono text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Auto-published & Live
          </span>
        </div>

        {/* Real Responsive Viewport Switcher */}
        <div className="flex items-center bg-[#151515] border border-white/10 rounded-xl p-1 shrink-0">
          <button
            type="button"
            onClick={() => setDevice("desktop")}
            className={cn(
              "p-1.5 rounded-lg text-xs transition-colors flex items-center gap-1 font-heading font-medium",
              device === "desktop" ? "bg-maroon-800 text-white shadow-glow" : "text-zinc-400 hover:text-white"
            )}
          >
            <Monitor className="w-3.5 h-3.5" /> <span className="hidden md:inline">Desktop</span>
          </button>
          <button
            type="button"
            onClick={() => setDevice("tablet")}
            className={cn(
              "p-1.5 rounded-lg text-xs transition-colors flex items-center gap-1 font-heading font-medium",
              device === "tablet" ? "bg-maroon-800 text-white shadow-glow" : "text-zinc-400 hover:text-white"
            )}
          >
            <Tablet className="w-3.5 h-3.5" /> <span className="hidden md:inline">Tablet</span>
          </button>
          <button
            type="button"
            onClick={() => setDevice("mobile")}
            className={cn(
              "p-1.5 rounded-lg text-xs transition-colors flex items-center gap-1 font-heading font-medium",
              device === "mobile" ? "bg-maroon-800 text-white shadow-glow" : "text-zinc-400 hover:text-white"
            )}
          >
            <Smartphone className="w-3.5 h-3.5" /> <span className="hidden md:inline">Mobile</span>
          </button>
        </div>

        {/* Save/Publish */}
        <Button
          variant="primary"
          size="sm"
          onClick={onSave}
          isLoading={isSaving}
          leftIcon={<Save className="w-3.5 h-3.5" />}
          className="text-xs font-bold"
        >
          Publish Changes
        </Button>
      </div>

      {/* Real Viewport Container */}
      <div className="flex-grow overflow-y-auto p-4 sm:p-6 lg:p-8 flex justify-center items-start bg-[#050505]">
        <div
          className={cn(
            "transition-all duration-300 shadow-2xl overflow-hidden flex flex-col justify-between my-auto bg-black",
            device === "mobile" && "w-[375px] max-w-full rounded-[36px] border-[6px] border-[#222222] min-h-[667px] shadow-2xl",
            device === "tablet" && "w-[768px] max-w-full rounded-[24px] border-[4px] border-[#222222] min-h-[800px] shadow-2xl",
            device === "desktop" && "w-full max-w-7xl rounded-2xl border border-white/10 shadow-2xl"
          )}
        >
          {/* Mobile Status Bar Simulation */}
          {device === "mobile" && (
            <div className="bg-black text-white/70 px-6 pt-3 pb-1 flex justify-between items-center text-[10px] font-mono select-none">
              <span>9:41</span>
              <div className="w-20 h-4 bg-[#1a1a1a] rounded-full mx-auto" />
              <span>5G 100%</span>
            </div>
          )}

          {/* Real Live Storefront Renderer Component */}
          <CartProvider storeSlug={previewStoreData.slug}>
            <div className="w-full overflow-x-hidden">
              <BloomStorefront
                store={previewStoreData}
                isSubdomain={false}
              />
            </div>
          </CartProvider>
        </div>
      </div>
    </div>
  );
}
