"use client";

import React from "react";
import Link from "next/link";
import Header from "../layout/Header";
import Footer from "../layout/Footer";
import ProductList from "./ProductList";
import { StoreData } from "@/types/store";
import { getFontStack } from "@/lib/typography-utils";
import { resolveImageUrl } from "@/lib/image-resolver";
import { CollectionSection } from "@/components/storefront/collection-section";
import { resolveThemeTokens } from "@/lib/theme-token-resolver";

export function getBloomThemeStyles(appearanceOrColors: any, typography?: any) {
  const settingsObj = appearanceOrColors?.branding || appearanceOrColors?.paletteId || appearanceOrColors?.customOverrides
    ? appearanceOrColors
    : { colors: appearanceOrColors, typography };

  const resolved = resolveThemeTokens(settingsObj);
  return resolved.styleObject;
}



export function getBloomFontsLink(typography: any) {
  const headingFont = typography?.headingFont || "Plus Jakarta Sans";
  const bodyFont = typography?.bodyFont || "Inter";

  const SYSTEM_FONTS = ["Helvetica Neue", "Helvetica", "Arial", "Impact", "Georgia", "Times New Roman"];
  const googleFontsToLoad: string[] = [];
  if (!SYSTEM_FONTS.includes(headingFont)) {
    googleFontsToLoad.push(`${headingFont}:wght@400;500;600;700`);
  }
  if (!SYSTEM_FONTS.includes(bodyFont)) {
    googleFontsToLoad.push(`${bodyFont}:wght@400;500;600;700`);
  }

  if (googleFontsToLoad.length > 0) {
    return `https://fonts.googleapis.com/css2?family=${googleFontsToLoad.join("&family=")}&display=swap`;
  }
  return null;
}

export default function BloomStorefront({
  store,
  isSubdomain = false,
  initialCategory,
  initialCollection,
}: {
  store: StoreData;
  isSubdomain?: boolean;
  initialCategory?: string;
  initialCollection?: string;
}) {
  // Filter products by category and collection query params if present
  const filteredProducts = store.products.filter((p) => {
    const matchesCategory = !initialCategory || initialCategory === "all" || p.categoryId === initialCategory;
    let matchesCollection = true;
    if (initialCollection && initialCollection !== "all") {
      const col = store.collections?.find((c) => c.id === initialCollection);
      matchesCollection = Boolean(col && col.selectedProductIds?.includes(p.id));
    }
    return matchesCategory && matchesCollection;
  });

  const basePath = isSubdomain ? "" : `/store/${store.slug}`;
  const fontsLink = getBloomFontsLink(store.appearance.typography);

  return (
    <div
      className="bloom-theme min-h-screen flex flex-col justify-between antialiased bg-bloom-background text-bloom-foreground"
      style={getBloomThemeStyles(store.appearance.colors, store.appearance.typography)}
    >
      {fontsLink && (
        <link rel="stylesheet" href={fontsLink} />
      )}
      <Header store={store} isSubdomain={isSubdomain} />
      
      <main className="flex-grow bg-bloom-background px-4 py-8 sm:py-12 lg:py-16 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Hero Banner Section (Responsive 16:9 Aspect Ratio) */}
        <section
          style={{ backgroundColor: "var(--bloom-secondary)" }}
          className="relative rounded-2xl sm:rounded-3xl overflow-hidden text-center border border-[var(--bloom-border)] mb-8 sm:mb-10 max-w-7xl mx-auto shadow-sm flex items-center justify-center p-4 sm:p-10 md:p-14 min-h-[220px] sm:min-h-[280px] md:min-h-[360px] aspect-[16/9] max-h-[480px]"
        >
          {store.appearance.branding.heroBannerUrl && (
            <div className="absolute inset-0 z-0">
              <img
                src={resolveImageUrl(store.appearance.branding.heroBannerUrl)}
                alt="Hero Banner"
                className="w-full h-full object-cover object-center aspect-[16/9]"
              />
              <div className="absolute inset-0 bg-black/40 backdrop-blur-[0.5px]" />
            </div>
          )}
          <div className="relative z-10 space-y-2.5 sm:space-y-4 max-w-2xl mx-auto px-2">
            <span
              style={{ color: "var(--bloom-foreground)", backgroundColor: "var(--bloom-background)" }}
              className="px-3 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-widest border border-[var(--bloom-border)] inline-block shadow-sm"
            >
              Official Catalog
            </span>
            <h1
              style={{ fontFamily: "var(--font-heading)" }}
              className="text-xl sm:text-3xl md:text-5xl font-extrabold text-[var(--bloom-foreground)] tracking-tight leading-tight"
            >
              {store.appearance.branding.tagline || store.appearance.branding.name}
            </h1>
            <p className="text-xs sm:text-sm text-[var(--bloom-foreground)] opacity-90 leading-relaxed max-w-lg mx-auto line-clamp-2 sm:line-clamp-3">
              {store.appearance.branding.description || "Discover premium products handcrafted with care."}
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3 w-full sm:w-auto">
              <a
                href="#products"
                style={{ backgroundColor: "var(--bloom-primary)" }}
                className="w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-2.5 text-xs font-bold text-white shadow-sm rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center"
              >
                View All Products
              </a>
              {store.appearance.branding.whatsapp && (
                <a
                  href={`https://wa.me/${store.appearance.branding.whatsapp.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ borderColor: "var(--bloom-border)", color: "var(--bloom-foreground)", backgroundColor: "var(--bloom-background)" }}
                  className="w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-2.5 text-xs font-semibold border rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center"
                >
                  WhatsApp Shop
                </a>
              )}
            </div>
          </div>
        </section>

        {/* Curated Collections Section (Pro Plan) */}
        {store.collections && store.collections.length > 0 && (
          <div className="mb-10">
            <CollectionSection
              collections={store.collections}
              storeSlug={store.slug}
              isSubdomain={isSubdomain}
            />
          </div>
        )}

        {/* Categories Quick Filter */}
        {store.categories.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
            <Link
              href={basePath || "/"}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                (!initialCategory || initialCategory === "all")
                  ? "bg-bloom-primary text-white border-transparent shadow-sm"
                  : "bg-bloom-secondary text-bloom-foreground border-bloom-border hover:bg-bloom-secondary/80"
              }`}
            >
              All Products
            </Link>
            {store.categories.map((c) => (
              <Link
                key={c.id}
                href={`${basePath || ""}?category=${c.id}#products`}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  initialCategory === c.id
                    ? "bg-bloom-primary text-white border-transparent shadow-sm"
                    : "bg-bloom-secondary text-bloom-foreground border-bloom-border hover:bg-bloom-secondary/80"
                }`}
              >
                {c.name}
              </Link>
            ))}
          </div>
        )}

        {/* Catalog Products Grid */}
        <ProductList
          products={filteredProducts}
          storeSlug={store.slug}
          storeId={store.id}
          isSubdomain={isSubdomain}
        />
      </main>

      <Footer store={store} isSubdomain={isSubdomain} />
    </div>
  );
}

