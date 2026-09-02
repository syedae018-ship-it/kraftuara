"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Truck,
  ShoppingBag,
  Menu,
  CheckCircle2,
  ExternalLink,
  Lock,
  ArrowRight,
  Wifi,
  Battery,
  Sparkles,
} from "lucide-react";
import { DEMO_STORE_DATA, DEMO_STORE_PRODUCTS } from "@/lib/demo-data";
import { getBloomThemeStyles } from "@/components/storefront/templates/bloom/home/BloomStorefront";
import { cn } from "@/lib/utils";

// WhatsApp Brand Icon component
function WhatsAppIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.301-.15-1.782-.88-2.059-.98-.276-.1-.477-.15-.678.15-.2.301-.778.98-.954 1.18-.176.2-.352.226-.653.075-.301-.15-1.272-.469-2.423-1.496-.895-.799-1.5-1.787-1.676-2.088-.176-.301-.019-.464.132-.614.136-.135.301-.351.452-.527.15-.176.201-.301.301-.502.101-.201.05-.377-.025-.527-.075-.151-.678-1.633-.929-2.236-.245-.588-.494-.508-.678-.518-.176-.01-.377-.01-.578-.01-.201 0-.527.075-.803.377-.276.301-1.054 1.03-1.054 2.511 0 1.482 1.079 2.912 1.23 3.113.15.201 2.124 3.243 5.145 4.549.718.311 1.279.497 1.716.636.722.23 1.378.197 1.898.12.579-.086 1.782-.728 2.033-1.431.251-.703.251-1.306.176-1.431-.075-.126-.276-.201-.577-.351z" />
      <path d="M12 2C6.477 2 2 6.477 2 12c0 1.77.462 3.498 1.34 5.025L2 22l5.127-1.311A9.957 9.957 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.2a8.17 8.17 0 01-4.17-1.144l-.299-.178-3.096.79.828-3.02-.195-.31A8.18 8.18 0 1112 20.2z" />
    </svg>
  );
}

interface ShowcaseProps {
  interactive?: boolean;
  className?: string;
  limitProducts?: number;
}

/**
 * Desktop Storefront Viewport (Realistic Kraftaura Classic Storefront)
 */
export function DesktopStorefrontScreen({
  interactive = true,
  className = "",
  limitProducts = 3,
}: ShowcaseProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const store = DEMO_STORE_DATA;
  const themeStyles = getBloomThemeStyles(store.appearance);

  const categories = [
    { id: "all", name: "All Products" },
    ...store.categories.slice(0, 5),
  ];

  const filteredProducts = DEMO_STORE_PRODUCTS.filter((p) => {
    if (selectedCategory === "all") return true;
    return p.categoryId === selectedCategory;
  }).slice(0, limitProducts);

  return (
    <div
      className={cn(
        "w-full bg-[#FFFFFF] text-[#18181B] flex flex-col font-sans select-none overflow-hidden",
        className
      )}
      style={themeStyles}
    >
      {/* 1. Storefront Header */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-zinc-200/80 px-4 sm:px-6 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link
            href="/demo"
            className="flex items-center gap-2 group cursor-pointer"
          >
            <div className="w-6 h-6 rounded-md bg-[#18181B] text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
              K
            </div>
            <span className="font-heading font-bold text-xs sm:text-sm tracking-tight text-zinc-900 group-hover:text-maroon-800 transition-colors">
              KRAFTAURA CLASSIC
            </span>
          </Link>

          <nav className="hidden sm:flex items-center gap-1 text-[11px] font-medium text-zinc-600">
            <Link
              href="/demo/track"
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-zinc-100 text-zinc-700 hover:text-black transition-colors"
            >
              <Truck className="w-3 h-3 text-maroon-700" />
              <span>Track Order</span>
            </Link>
            <Link
              href="/demo"
              className="px-2.5 py-1 rounded-lg hover:bg-zinc-100 text-zinc-700 hover:text-black transition-colors"
            >
              Contact
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Live Track Order button for Growth / Pro stores */}
          <Link
            href="/demo/track"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-800 transition-all shadow-2xs"
            title="Track customer order status"
          >
            <Truck className="w-3 h-3 text-maroon-800" />
            <span className="hidden xs:inline">Track Order</span>
          </Link>

          {/* Cart Bag */}
          <Link
            href="/demo"
            className="relative p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-800 transition-colors"
            aria-label="Shopping Cart"
          >
            <ShoppingBag className="w-4 h-4 text-zinc-800" />
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-maroon-800 text-white text-[9px] font-bold flex items-center justify-center shadow-xs">
              2
            </span>
          </Link>
        </div>
      </header>

      {/* Storefront Viewport Body */}
      <div className="p-3.5 sm:p-5 space-y-4 overflow-y-auto max-h-[500px] scrollbar-thin">
        {/* 2. Hero Banner */}
        <div className="relative rounded-xl sm:rounded-2xl bg-gradient-to-br from-zinc-100 via-zinc-50 to-zinc-100 border border-zinc-200/90 p-4 sm:p-6 text-center shadow-xs">
          <div className="max-w-md mx-auto space-y-2">
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase bg-white border border-zinc-200 text-maroon-800 shadow-2xs">
              Official Catalog
            </span>
            <h2 className="text-base sm:text-xl font-extrabold font-heading text-zinc-900 tracking-tight leading-snug">
              Handcrafted Artisan Living & Modern Essentials
            </h2>
            <p className="text-[10px] sm:text-xs text-zinc-600 line-clamp-2 leading-relaxed">
              Curated small-batch homeware, leather goods, and sustainable living
              essentials with instant WhatsApp ordering.
            </p>

            <div className="pt-1 flex items-center justify-center gap-2">
              <Link
                href="/demo"
                className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-black text-white text-[10px] font-bold shadow-xs transition-colors"
              >
                View Catalog
              </Link>
              <Link
                href="/demo"
                className="px-3 py-1.5 rounded-lg border border-emerald-600/30 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-[10px] font-semibold transition-colors flex items-center gap-1"
              >
                <WhatsAppIcon className="w-3 h-3 text-emerald-600" />
                <span>WhatsApp Shop</span>
              </Link>
            </div>
          </div>
        </div>

        {/* 3. Category Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[11px]">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => interactive && setSelectedCategory(cat.id)}
                className={cn(
                  "shrink-0 px-3 py-1 rounded-full text-[10px] font-medium border transition-all cursor-pointer whitespace-nowrap",
                  isActive
                    ? "bg-zinc-900 text-white border-zinc-900 shadow-xs"
                    : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300 hover:text-black"
                )}
              >
                {cat.name}
              </button>
            );
          })}
        </div>

        {/* 4. Product Catalog Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filteredProducts.map((prod) => {
            const coverImg =
              prod.images.find((i) => i.isCover)?.url || prod.images[0]?.url;
            return (
              <div
                key={prod.id}
                className="group rounded-xl border border-zinc-200 bg-white p-2 sm:p-2.5 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-zinc-100">
                    <img
                      src={coverImg}
                      alt={prod.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-xs text-white text-[8px] font-medium uppercase tracking-wider">
                      {prod.categoryName}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-[11px] font-bold font-heading text-zinc-900 line-clamp-1 group-hover:text-maroon-800 transition-colors">
                      {prod.name}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-xs font-bold text-zinc-900 font-heading">
                        ₹{prod.price.toLocaleString("en-IN")}
                      </span>
                      {prod.compareAtPrice && (
                        <span className="text-[10px] text-zinc-400 line-through">
                          ₹{prod.compareAtPrice.toLocaleString("en-IN")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-2 mt-2 border-t border-zinc-100">
                  <Link
                    href="/demo"
                    className="w-full py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-semibold flex items-center justify-center gap-1 transition-colors shadow-2xs"
                  >
                    <WhatsAppIcon className="w-3 h-3" />
                    <span>Order via WhatsApp</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Store Trust Footer Snippet */}
        <div className="pt-2 flex items-center justify-between text-[10px] text-zinc-500 border-t border-zinc-100">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Accepting Orders on WhatsApp & UPI</span>
          </div>
          <Link
            href="/demo"
            className="text-maroon-800 font-semibold hover:underline flex items-center gap-0.5"
          >
            Full Catalog <ArrowRight className="w-2.5 h-2.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * Mobile Storefront Viewport (Realistic Mobile View inside Phone chassis)
 */
export function MobileStorefrontScreen({
  className = "",
  limitProducts = 3,
}: ShowcaseProps) {
  const store = DEMO_STORE_DATA;
  const themeStyles = getBloomThemeStyles(store.appearance);

  const displayProducts = DEMO_STORE_PRODUCTS.slice(0, limitProducts);

  return (
    <div
      className={cn(
        "w-full h-full bg-white text-[#18181B] flex flex-col font-sans select-none overflow-hidden",
        className
      )}
      style={themeStyles}
    >
      {/* Mobile Top Status Bar */}
      <div className="bg-white px-5 pt-2.5 pb-1 flex items-center justify-between text-[10px] text-zinc-700 font-semibold border-b border-zinc-100 shrink-0">
        <span>9:41</span>
        <div className="flex items-center gap-1.5 text-zinc-600">
          <Wifi className="w-3 h-3" />
          <Battery className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* Mobile Store Header */}
      <header className="bg-white border-b border-zinc-200/80 px-3.5 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-[#18181B] text-white flex items-center justify-center text-[9px] font-bold">
            K
          </div>
          <span className="font-heading font-extrabold text-[11px] tracking-tight text-zinc-900">
            KRAFTAURA CLASSIC
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Link
            href="/demo/track"
            className="flex items-center gap-1 px-2 py-0.5 rounded-md border border-zinc-200 text-[9px] font-medium text-zinc-700 bg-zinc-50"
          >
            <Truck className="w-2.5 h-2.5 text-maroon-800" />
            <span>Track</span>
          </Link>
          <div className="relative p-1">
            <ShoppingBag className="w-3.5 h-3.5 text-zinc-800" />
            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-maroon-800 text-white text-[8px] font-bold flex items-center justify-center">
              2
            </span>
          </div>
        </div>
      </header>

      {/* Mobile Body Content */}
      <div className="p-3 space-y-3 overflow-y-auto flex-1 scrollbar-none">
        {/* Compact Mobile Hero */}
        <div className="rounded-xl bg-gradient-to-br from-zinc-100 to-zinc-50 border border-zinc-200/80 p-3 text-center space-y-1.5 shadow-2xs">
          <span className="inline-block px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider bg-white border border-zinc-200 text-maroon-800">
            Official Catalog
          </span>
          <h3 className="text-xs font-extrabold font-heading text-zinc-900 leading-snug">
            Artisan Living & Modern Essentials
          </h3>
          <p className="text-[9px] text-zinc-600 line-clamp-1">
            Handcrafted ceramics, leather, soy candles & decor.
          </p>
          <Link
            href="/demo"
            className="mt-1 inline-flex items-center justify-center gap-1 w-full py-1.5 rounded-lg bg-emerald-600 text-white text-[10px] font-bold shadow-2xs"
          >
            <WhatsAppIcon className="w-3 h-3" />
            <span>Shop on WhatsApp</span>
          </Link>
        </div>

        {/* Category Scroll Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[10px]">
          <span className="shrink-0 px-2.5 py-0.5 rounded-full bg-zinc-900 text-white font-medium">
            All
          </span>
          <span className="shrink-0 px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200 font-medium">
            Home Decor
          </span>
          <span className="shrink-0 px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200 font-medium">
            Leather
          </span>
          <span className="shrink-0 px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200 font-medium">
            Fragrance
          </span>
        </div>

        {/* Mobile Products Grid */}
        <div className="grid grid-cols-2 gap-2">
          {displayProducts.map((prod) => {
            const coverImg =
              prod.images.find((i) => i.isCover)?.url || prod.images[0]?.url;
            return (
              <div
                key={prod.id}
                className="rounded-lg border border-zinc-200 bg-white p-2 shadow-2xs flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="aspect-square w-full rounded-md overflow-hidden bg-zinc-100">
                    <img
                      src={coverImg}
                      alt={prod.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-zinc-900 line-clamp-1">
                      {prod.name}
                    </h4>
                    <div className="text-[10px] font-extrabold text-zinc-900">
                      ₹{prod.price.toLocaleString("en-IN")}
                    </div>
                  </div>
                </div>

                <Link
                  href="/demo"
                  className="mt-2 w-full py-1 px-1 rounded bg-emerald-600 text-white text-[9px] font-bold flex items-center justify-center gap-1"
                >
                  <WhatsAppIcon className="w-2.5 h-2.5" />
                  <span>Order</span>
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      {/* iPhone Home Bar */}
      <div className="py-1.5 bg-white shrink-0">
        <div className="w-28 h-1 bg-zinc-300 rounded-full mx-auto" />
      </div>
    </div>
  );
}

/**
 * Full Hero Device Mockup Container:
 * - Laptop/Browser Frame (Desktop storefront)
 * - Mobile Phone Frame (Responsive mobile storefront)
 * - Fully responsive with smart mobile toggle to avoid cramped side-by-side viewports on mobile devices.
 */
export function HeroStorefrontShowcase() {
  const [mobileActiveTab, setMobileActiveTab] = useState<"desktop" | "mobile">("desktop");

  return (
    <div className="w-full max-w-6xl mx-auto relative z-10">
      {/* Mobile (< md screens) Device Selector */}
      <div className="flex md:hidden items-center justify-center mb-4">
        <div className="bg-[#151515] p-1 rounded-xl border border-white/10 inline-flex items-center gap-1 shadow-lg">
          <button
            type="button"
            onClick={() => setMobileActiveTab("desktop")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium font-heading transition-colors cursor-pointer",
              mobileActiveTab === "desktop"
                ? "bg-maroon-800 text-white shadow-glow"
                : "text-zinc-400 hover:text-white"
            )}
          >
            Desktop Storefront
          </button>
          <button
            type="button"
            onClick={() => setMobileActiveTab("mobile")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium font-heading transition-colors cursor-pointer",
              mobileActiveTab === "mobile"
                ? "bg-maroon-800 text-white shadow-glow"
                : "text-zinc-400 hover:text-white"
            )}
          >
            Mobile Storefront
          </button>
        </div>
      </div>

      {/* Desktop & Tablet Composition (Side-by-Side / Overlapping Layer) */}
      <div className="relative flex items-end justify-center">
        {/* LAPTOP / BROWSER FRAME */}
        <div
          className={cn(
            "relative rounded-2xl sm:rounded-3xl p-2 sm:p-3.5 bg-[#111111]/90 border border-white/15 shadow-2xl backdrop-blur-2xl overflow-hidden maroon-gradient-border z-10 w-full md:w-[820px] transition-all",
            mobileActiveTab === "mobile" ? "hidden md:block" : "block"
          )}
        >
          {/* Browser Chrome Bar */}
          <div className="flex items-center justify-between px-3 sm:px-4 py-2 border-b border-white/10 bg-[#080808]/80 rounded-xl mb-2 sm:mb-3">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500/80 inline-block" />
              <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-500/80 inline-block" />
            </div>

            {/* Address Bar */}
            <div className="flex items-center gap-1.5 px-3 sm:px-4 py-1 rounded-lg bg-[#151515] border border-white/10 text-[10px] sm:text-[11px] font-mono text-zinc-300 max-w-[280px] sm:max-w-xs truncate">
              <Lock className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
              <span className="text-zinc-500">https://</span>
              <span className="text-zinc-200">craft-store.kraftaura.in</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Store
              </span>
              <Link
                href="/demo"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-[10px] text-zinc-400 hover:text-white font-mono border border-white/5 transition-colors"
                title="Open live demo in new tab"
              >
                <span>Demo</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </Link>
            </div>
          </div>

          {/* Actual Storefront Rendered Inside Browser Frame */}
          <div className="rounded-xl overflow-hidden shadow-inner border border-zinc-200/40">
            <DesktopStorefrontScreen interactive={true} limitProducts={3} />
          </div>
        </div>

        {/* MOBILE PHONE FRAME */}
        <div
          className={cn(
            "z-20 w-[270px] sm:w-[290px] rounded-[42px] border-[6px] sm:border-[8px] border-zinc-800 bg-black p-1.5 shadow-[0_25px_60px_rgba(0,0,0,0.9)] overflow-hidden transition-all",
            "md:absolute md:-right-4 lg:-right-6 md:-bottom-6",
            mobileActiveTab === "desktop" ? "hidden md:block" : "block mx-auto"
          )}
        >
          {/* Dynamic Island Notch */}
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-24 h-5 bg-black rounded-full z-30 flex items-center justify-between px-2">
            <span className="w-2 h-2 rounded-full bg-zinc-900 border border-zinc-800" />
            <span className="w-1.5 h-1.5 rounded-full bg-blue-950/80" />
          </div>

          {/* Phone Viewport */}
          <div className="relative w-full h-[460px] sm:h-[500px] rounded-[32px] overflow-hidden bg-white shadow-inner">
            <MobileStorefrontScreen limitProducts={3} />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Dedicated Template Showcase Component for the "#templates" section:
 * Supports toggle between Desktop and Mobile Kraftaura Classic preview.
 */
export function TemplateStorefrontShowcase({
  mode = "desktop",
}: {
  mode: "desktop" | "mobile";
}) {
  if (mode === "mobile") {
    return (
      <div className="w-[280px] sm:w-[320px] mx-auto rounded-[42px] border-[8px] border-zinc-800 bg-black p-1.5 shadow-[0_25px_60px_rgba(0,0,0,0.8)] overflow-hidden relative">
        <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-24 h-5 bg-black rounded-full z-30 flex items-center justify-between px-2">
          <span className="w-2 h-2 rounded-full bg-zinc-900 border border-zinc-800" />
          <span className="w-1.5 h-1.5 rounded-full bg-blue-950/80" />
        </div>
        <div className="relative w-full h-[470px] sm:h-[520px] rounded-[32px] overflow-hidden bg-white shadow-inner">
          <MobileStorefrontScreen limitProducts={4} />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl border border-white/10 bg-[#111111] p-2.5 shadow-2xl overflow-hidden">
      {/* Browser Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/10 bg-[#080808]/70 rounded-lg mb-2">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
        </div>
        <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-md bg-[#151515] border border-white/10 text-[10px] font-mono text-zinc-300">
          <Lock className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
          <span>kraftaura.in/demo</span>
        </div>
        <div className="text-[9px] text-emerald-400 font-mono flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Classic Template
        </div>
      </div>

      {/* Desktop Storefront Screen */}
      <div className="rounded-xl overflow-hidden border border-zinc-200">
        <DesktopStorefrontScreen interactive={true} limitProducts={4} />
      </div>
    </div>
  );
}
