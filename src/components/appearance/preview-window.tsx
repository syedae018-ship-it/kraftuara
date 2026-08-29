"use client";

import React, { useState } from "react";
import { AppearanceSettings } from "@/types/theme";
import { Product } from "@/types/product";
import { getFontStack } from "@/lib/typography-utils";

import { Category } from "@/types/category";

const initialMockCategories: Category[] = [
  { id: "1", name: "Featured", slug: "featured", displayOrder: 0, status: "published", productCount: 5, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "2", name: "New Arrivals", slug: "new-arrivals", displayOrder: 1, status: "published", productCount: 3, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
];
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { resolveThemeTokens } from "@/lib/theme-token-resolver";
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
import { resolveImageUrl, FALLBACK_PRODUCT_IMAGE } from "@/lib/image-resolver";

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
  const resolvedTheme = resolveThemeTokens(settings);


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
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Auto-published & Live
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
        <Button variant="outline" size="sm" onClick={onSave} isLoading={isSaving} leftIcon={<Save className="w-3.5 h-3.5" />} className="border-white/10 text-xs">
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
            backgroundColor: "var(--color-background)",
            color: "var(--color-text-primary)",
            borderColor: "var(--color-border)",
            ...resolvedTheme.styleObject,
          }}
        >
          {/* Header */}
          <header className="p-4 border-b border-[var(--color-border)] flex items-center justify-between sticky top-0 z-30 bg-[var(--color-surface)]/95 backdrop-blur-md">
            <div className="flex items-center gap-3">
              {settings.branding.logoUrl ? (
                <img
                  src={resolveImageUrl(settings.branding.logoUrl)}
                  alt={settings.branding.name}
                  className="w-8 h-8 rounded-lg object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <div
                  style={{ backgroundColor: "var(--color-primary)", color: "var(--color-primary-foreground)" }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shadow-sm"
                >
                  {settings.branding.name.charAt(0)}
                </div>
              )}
              <div className="text-left">
                <h4 style={{ fontFamily: "var(--font-heading)" }} className="text-sm font-bold text-[var(--color-text-primary)] tracking-tight">{settings.branding.name}</h4>
                <p style={{ fontFamily: "var(--font-body)" }} className="text-[10px] text-[var(--color-text-secondary)]">{settings.branding.tagline}</p>
              </div>
            </div>

            <button
              type="button"
              style={{ backgroundColor: "var(--color-cta)", color: "var(--color-cta-foreground)" }}
              className="px-3.5 py-1.5 text-[11px] font-semibold shadow-sm flex items-center gap-1.5 rounded-xl hover:opacity-90 transition-opacity"
            >
              <MessageSquare className="w-3.5 h-3.5" /> WhatsApp Shop
            </button>
          </header>

          {/* Body Sections */}
          <main style={{ fontFamily: "var(--font-body)" }} className="flex-1 space-y-12 p-4 sm:p-8 bg-[var(--color-background)]">
            {/* Hero */}
            <section
              style={{ backgroundColor: "var(--color-background-secondary)", borderColor: "var(--color-border)" }}
              className="relative p-8 rounded-2xl overflow-hidden text-center space-y-4 border"
            >
              {settings.branding.heroBannerUrl && (
                <div className="absolute inset-0 z-0 opacity-15">
                  <img
                    src={resolveImageUrl(settings.branding.heroBannerUrl)}
                    alt="Hero"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="relative z-10 space-y-3 max-w-2xl mx-auto">
                <span
                  style={{ color: "var(--color-text-primary)", backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
                  className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border inline-block shadow-sm"
                >
                  Official Catalog
                </span>
                <h1
                  style={{ fontFamily: "var(--font-heading)" }}
                  className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text-primary)] tracking-tight leading-tight"
                >
                  {settings.branding.tagline || settings.branding.name}
                </h1>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed max-w-lg mx-auto">
                  {settings.branding.description || "Discover premium products handcrafted with care."}
                </p>
                <div className="pt-2 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    style={{ backgroundColor: "var(--color-cta)", color: "var(--color-cta-foreground)" }}
                    className="px-5 py-2.5 text-xs font-bold shadow-sm rounded-xl hover:opacity-90 transition-opacity"
                  >
                    View All Products
                  </button>
                  <button
                    type="button"
                    style={{ backgroundColor: "var(--color-secondary)", color: "var(--color-secondary-foreground)", borderColor: "var(--color-border)" }}
                    className="px-5 py-2.5 text-xs font-semibold border rounded-xl hover:opacity-90 transition-opacity"
                  >
                    About Us
                  </button>
                </div>
              </div>
            </section>

            {/* Products Grid */}
            <section className="space-y-4 text-left">
              <div className="flex items-center justify-between">
                <div>
                  <h3 style={{ fontFamily: "var(--font-heading)" }} className="text-base font-bold text-[var(--color-text-primary)]">Our Catalog</h3>
                  <p className="text-xs text-[var(--color-text-secondary)]">Handmade with love &amp; premium materials</p>
                </div>
                <button
                  type="button"
                  style={{ color: "var(--color-cta)" }}
                  className="text-xs font-semibold hover:underline"
                >
                  View All →
                </button>
              </div>

              {!products || products.length === 0 ? (
                <div style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }} className="p-8 text-center rounded-2xl border">
                  <Package className="w-8 h-8 mx-auto text-zinc-400 mb-2" />
                  <span className="text-xs text-[var(--color-text-secondary)] block">
                    No products added yet. Add products from the dashboard to display them here.
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {products.slice(0, 6).map((prod) => (
                    <div
                      key={prod.id}
                      style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
                      className="group relative border rounded-2xl overflow-hidden hover:shadow-md transition-all flex flex-col justify-between p-3 space-y-2 text-left"
                    >
                      <div style={{ backgroundColor: "var(--color-background-secondary)" }} className="aspect-square rounded-xl overflow-hidden relative">
                        {prod.images && prod.images.length > 0 ? (
                          <img
                            src={resolveImageUrl(prod.images[0].url)}
                            alt={prod.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = FALLBACK_PRODUCT_IMAGE;
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-400">
                            <Package className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-[var(--color-text-primary)] line-clamp-1" style={{ fontFamily: "var(--font-heading)" }}>{prod.name}</h4>
                        <p className="text-xs font-bold font-mono text-[var(--color-price)]">{formatCurrency(prod.price)}</p>
                      </div>
                      <button
                        type="button"
                        style={{ backgroundColor: "var(--color-add-to-cart)", color: "var(--color-add-to-cart-foreground)" }}
                        className="w-full py-1.5 text-[11px] font-semibold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 mt-1"
                      >
                        <Package className="w-3.5 h-3.5" /> Add to Cart
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Categories */}
            <section className="space-y-4 text-left">
              <h3 style={{ fontFamily: "var(--font-heading)" }} className="text-base font-bold text-[var(--color-text-primary)]">Browse Categories</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(!categories || categories.length === 0 ? initialMockCategories : categories).slice(0, 4).map((c: Category) => (
                  <div
                    key={c.id}
                    style={{ backgroundColor: "var(--color-background-secondary)", borderColor: "var(--color-border)" }}
                    className="p-3 border text-center space-y-1.5 rounded-2xl hover:opacity-90 transition-all cursor-pointer"
                  >
                    <div
                      style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-primary)" }}
                      className="w-9 h-9 rounded-full mx-auto border flex items-center justify-center shadow-sm"
                    >
                      <Package className="w-4.5 h-4.5" />
                    </div>
                    <h6 style={{ fontFamily: "var(--font-heading)" }} className="text-xs font-bold text-[var(--color-text-primary)]">{c.name}</h6>
                    <span className="text-[9px] text-[var(--color-text-secondary)] block">{c.productCount || 0} products</span>
                  </div>
                ))}
              </div>
            </section>
          </main>

          {/* Footer */}
          <footer
            style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
            className="p-6 border-t text-center space-y-3 text-xs text-[var(--color-text-secondary)]"
          >
            <p style={{ fontFamily: "var(--font-heading)" }} className="font-bold text-[var(--color-text-primary)]">{settings.branding.name} © 2026</p>
            {settings.branding.address && <p className="text-[11px] text-[var(--color-text-secondary)]">{settings.branding.address}</p>}
            <div className="flex justify-center gap-4 text-[10px] text-[var(--color-text-secondary)]">
              {settings.branding.email && <span>{settings.branding.email}</span>}
              {settings.branding.phone && <span>{settings.branding.phone}</span>}
            </div>
            
            {/* Social Links */}
            {(settings.branding.facebook || settings.branding.instagram) && (
              <div className="flex justify-center gap-3 pt-1">
                {settings.branding.facebook && (
                  <span
                    style={{ backgroundColor: "var(--color-background-secondary)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}
                    className="px-2 py-1 rounded border text-[9px] font-medium"
                  >
                    Facebook
                  </span>
                )}
                {settings.branding.instagram && (
                  <span
                    style={{ backgroundColor: "var(--color-background-secondary)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}
                    className="px-2 py-1 rounded border text-[9px] font-medium"
                  >
                    Instagram
                  </span>
                )}
              </div>
            )}
          </footer>
        </div>

      </div>
    </div>
  );
}
