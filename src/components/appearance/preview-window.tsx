"use client";

import React, { useState } from "react";
import { AppearanceSettings } from "@/types/theme";
import { Product } from "@/types/product";
import { getFontStack } from "./typography-picker";
import { Category } from "@/types/category";

const initialMockCategories: Category[] = [
  { id: "1", name: "Featured", slug: "featured", displayOrder: 0, status: "published", productCount: 5, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "2", name: "New Arrivals", slug: "new-arrivals", displayOrder: 1, status: "published", productCount: 3, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
];
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import {
  Monitor,
  Tablet,
  Smartphone,
  Undo2,
  Redo2,
  RotateCcw,
  Save,
  MessageSquare,
  Star,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  categories,
  products,
}: PreviewWindowProps) {
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");

  const headingFont = settings.typography.headingFont || "Helvetica Neue";
  const bodyFont = settings.typography.bodyFont || "Inter";

  // Load fonts dynamically from Google Fonts only if not system/local fonts
  const SYSTEM_FONTS = ["Helvetica Neue", "Helvetica", "Arial", "Impact", "Georgia", "Times New Roman"];
  const googleFontsToLoad: string[] = [];
  if (!SYSTEM_FONTS.includes(headingFont)) {
    googleFontsToLoad.push(`${headingFont}:wght@400;500;600;700`);
  }
  if (!SYSTEM_FONTS.includes(bodyFont)) {
    googleFontsToLoad.push(`${bodyFont}:wght@400;500;600;700`);
  }
  const googleFontsLink = googleFontsToLoad.length > 0
    ? `https://fonts.googleapis.com/css2?family=${googleFontsToLoad.join("&family=")}&display=swap`
    : null;

  return (
    <div className={cn("flex-1 flex flex-col h-full bg-[#080808] overflow-hidden", className)}>
      {/* Dynamic Font Loader Link */}
      {googleFontsLink && (
        <link rel="stylesheet" href={googleFontsLink} />
      )}

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
            title="Reset"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/40 text-[10px] font-mono text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Auto-saved
          </span>
        </div>

        {/* Device Switcher */}
        <div className="flex items-center bg-[#151515] border border-white/10 rounded-xl p-1 shrink-0">
          <button
            type="button"
            onClick={() => setDevice("desktop")}
            className={cn(
              "p-1.5 rounded-lg text-xs transition-colors flex items-center gap-1 font-heading font-medium",
              device === "desktop" ? "bg-maroon-800 text-white" : "text-zinc-400 hover:text-white"
            )}
          >
            <Monitor className="w-3.5 h-3.5" /> <span className="hidden md:inline">Desktop</span>
          </button>
          <button
            type="button"
            onClick={() => setDevice("tablet")}
            className={cn(
              "p-1.5 rounded-lg text-xs transition-colors flex items-center gap-1 font-heading font-medium",
              device === "tablet" ? "bg-maroon-800 text-white" : "text-zinc-400 hover:text-white"
            )}
          >
            <Tablet className="w-3.5 h-3.5" /> <span className="hidden md:inline">Tablet</span>
          </button>
          <button
            type="button"
            onClick={() => setDevice("mobile")}
            className={cn(
              "p-1.5 rounded-lg text-xs transition-colors flex items-center gap-1 font-heading font-medium",
              device === "mobile" ? "bg-maroon-800 text-white" : "text-zinc-400 hover:text-white"
            )}
          >
            <Smartphone className="w-3.5 h-3.5" /> <span className="hidden md:inline">Mobile</span>
          </button>
        </div>

        {/* Save/Publish */}
        <Button variant="primary" size="sm" onClick={onSave} isLoading={isSaving} leftIcon={<Save className="w-3.5 h-3.5" />}>
          Publish Changes
        </Button>
      </div>

      {/* Mock Viewport */}
      <div className="flex-grow overflow-y-auto p-4 sm:p-8 flex justify-center bg-[#050505]">
        <div
          className={cn(
            "transition-all duration-300 shadow-2xl border overflow-hidden flex flex-col justify-between my-auto min-h-[700px]",
            device === "mobile" && "w-[375px] rounded-3xl min-h-[667px]",
            device === "tablet" && "w-[768px] rounded-2xl min-h-[800px]",
            device === "desktop" && "w-full max-w-5xl rounded-2xl"
          )}
          style={{
            backgroundColor: "var(--bloom-background)",
            color: "var(--bloom-foreground)",
            borderColor: "var(--bloom-border)",
            "--bloom-background": settings.colors.background || "#FFFFFF",
            "--bloom-foreground": settings.colors.primary || "#18181B",
            "--bloom-primary": settings.colors.accent || "#F97316",
            "--bloom-secondary": settings.colors.secondary || "#F4F4F5",
            "--bloom-border": settings.colors.secondary || "#F4F4F5",
            "--bloom-accent": `${settings.colors.accent || "#F97316"}15`,
            "--font-heading": getFontStack(headingFont),
            "--font-body": getFontStack(bodyFont),
          } as React.CSSProperties}
        >
          {/* Header */}
          <header className="p-4 border-b border-[var(--bloom-border)] flex items-center justify-between sticky top-0 z-30 bg-[var(--bloom-background)]/95 backdrop-blur-md">
            <div className="flex items-center gap-3">
              {settings.branding.logoUrl ? (
                <img src={settings.branding.logoUrl} alt={settings.branding.name} className="w-8 h-8 rounded-lg object-cover" />
              ) : (
                <div
                  style={{ backgroundColor: "var(--bloom-primary)" }}
                  className="w-8 h-8 rounded-lg border border-transparent flex items-center justify-center font-bold text-white text-xs"
                >
                  {settings.branding.name.charAt(0)}
                </div>
              )}
              <div className="text-left">
                <h4 style={{ fontFamily: "var(--font-heading)" }} className="text-sm font-bold text-[var(--bloom-foreground)] tracking-tight">{settings.branding.name}</h4>
                <p style={{ fontFamily: "var(--font-body)" }} className="text-[10px] text-[var(--bloom-foreground)] opacity-70">{settings.branding.tagline}</p>
              </div>
            </div>

            <button
              type="button"
              style={{ backgroundColor: "var(--bloom-primary)" }}
              className="px-3.5 py-1.5 text-[11px] font-semibold text-white shadow-sm flex items-center gap-1.5 rounded-xl hover:opacity-90 transition-opacity"
            >
              <MessageSquare className="w-3.5 h-3.5" /> WhatsApp Shop
            </button>
          </header>

          {/* Body Sections */}
          <main style={{ fontFamily: "var(--font-body)" }} className="flex-1 space-y-12 p-4 sm:p-8">
            {/* Hero */}
            <section
              style={{ backgroundColor: "var(--bloom-secondary)" }}
              className="relative p-8 rounded-2xl overflow-hidden text-center space-y-4 border border-[var(--bloom-border)]"
            >
              {settings.branding.heroBannerUrl && (
                <div className="absolute inset-0 z-0 opacity-10">
                  <img src={settings.branding.heroBannerUrl} alt="Hero" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="relative z-10 space-y-3 max-w-2xl mx-auto">
                <span
                  style={{ color: "var(--bloom-foreground)", backgroundColor: "rgba(255,255,255,0.8)" }}
                  className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-[var(--bloom-border)] inline-block"
                >
                  Official Catalog
                </span>
                <h1
                  style={{ fontFamily: "var(--font-heading)" }}
                  className="text-2xl sm:text-3xl font-extrabold text-[var(--bloom-foreground)] tracking-tight leading-tight"
                >
                  {settings.branding.tagline || settings.branding.name}
                </h1>
                <p className="text-xs text-[var(--bloom-foreground)] opacity-80 leading-relaxed max-w-lg mx-auto">
                  {settings.branding.description || "Discover premium products handcrafted with care."}
                </p>
                <div className="pt-2 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    style={{ backgroundColor: "var(--bloom-primary)" }}
                    className="px-5 py-2.5 text-xs font-bold text-white shadow-sm rounded-xl hover:opacity-90 transition-opacity"
                  >
                    Explore Shop
                  </button>
                </div>
              </div>
            </section>

            {/* Products Grid */}
            <section className="space-y-4 text-left">
              <div className="flex items-center justify-between">
                <h3 style={{ fontFamily: "var(--font-heading)" }} className="text-base font-bold text-[var(--bloom-foreground)]">Products</h3>
                <span className="text-xs font-semibold cursor-pointer" style={{ color: "var(--bloom-primary)" }}>View All →</span>
              </div>
              {!products || products.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 border border-dashed border-[var(--bloom-border)] rounded-xl text-center space-y-2">
                  <Package className="w-8 h-8 text-zinc-300 animate-pulse" />
                  <span className="text-xs font-bold text-[var(--bloom-foreground)]" style={{ fontFamily: "var(--font-heading)" }}>No products yet</span>
                  <span className="text-[10px] text-gray-500 max-w-[200px]">
                    Add your first product from the dashboard once setup is complete.
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {products.slice(0, 6).map((prod) => (
                    <div key={prod.id} className="group relative bg-[var(--bloom-background)] border border-[var(--bloom-border)] rounded-2xl overflow-hidden hover:shadow-md transition-all flex flex-col justify-between p-3 space-y-2 text-left">
                      <div className="aspect-square rounded-xl bg-[var(--bloom-secondary)] overflow-hidden relative">
                        {prod.images && prod.images.length > 0 ? (
                          <img src={prod.images[0].url} alt={prod.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-300">
                            <Package className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-[var(--bloom-foreground)] line-clamp-1" style={{ fontFamily: "var(--font-heading)" }}>{prod.name}</h4>
                        <p className="text-[10px] font-semibold font-mono text-[var(--bloom-primary)]">{formatCurrency(prod.price)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Categories */}
            <section className="space-y-4 text-left">
              <h3 style={{ fontFamily: "var(--font-heading)" }} className="text-base font-bold text-[var(--bloom-foreground)]">Browse Categories</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(!categories || categories.length === 0 ? initialMockCategories : categories).slice(0, 4).map((c: Category) => (
                  <div key={c.id} className="p-3 bg-[var(--bloom-secondary)] border border-[var(--bloom-border)] text-center space-y-1.5 rounded-2xl hover:opacity-90 transition-all cursor-pointer">
                    <div className="w-9 h-9 rounded-full mx-auto bg-[var(--bloom-background)] border border-[var(--bloom-border)] flex items-center justify-center" style={{ color: "var(--bloom-primary)" }}>
                      <Package className="w-4.5 h-4.5" />
                    </div>
                    <h6 style={{ fontFamily: "var(--font-heading)" }} className="text-xs font-bold text-[var(--bloom-foreground)]">{c.name}</h6>
                    <span className="text-[9px] text-zinc-400 block">{c.productCount || 0} products</span>
                  </div>
                ))}
              </div>
            </section>
          </main>

          {/* Footer */}
          <footer className="p-6 border-t border-[var(--bloom-border)] bg-[var(--bloom-secondary)] text-center space-y-3 text-xs text-zinc-400">
            <p style={{ fontFamily: "var(--font-heading)" }} className="font-bold text-[var(--bloom-foreground)]">{settings.branding.name} © 2026</p>
            {settings.branding.address && <p className="text-[11px] text-zinc-500">{settings.branding.address}</p>}
            <div className="flex justify-center gap-4 text-[10px] text-zinc-500">
              {settings.branding.email && <span>{settings.branding.email}</span>}
              {settings.branding.phone && <span>{settings.branding.phone}</span>}
            </div>
            
            {/* Social Links */}
            {(settings.branding.facebook || settings.branding.instagram) && (
              <div className="flex justify-center gap-3 pt-1">
                {settings.branding.facebook && (
                  <span className="px-2 py-1 rounded bg-[var(--bloom-background)] border border-[var(--bloom-border)] text-[9px] font-medium text-[var(--bloom-foreground)]">Facebook</span>
                )}
                {settings.branding.instagram && (
                  <span className="px-2 py-1 rounded bg-[var(--bloom-background)] border border-[var(--bloom-border)] text-[9px] font-medium text-[var(--bloom-foreground)]">Instagram</span>
                )}
              </div>
            )}
          </footer>
        </div>
      </div>
    </div>
  );
}
