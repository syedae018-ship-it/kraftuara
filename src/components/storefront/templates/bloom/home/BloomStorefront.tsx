"use client";

import React from "react";
import Link from "next/link";
import Header from "../layout/Header";
import Footer from "../layout/Footer";
import ProductList from "./ProductList";
import { StoreData } from "@/types/store";
import { getFontStack } from "@/components/appearance/typography-picker";

export function getBloomThemeStyles(colors: any, typography: any) {
  const bg = colors?.background || "#FFFFFF";
  const text = colors?.primary || "#18181B";
  const accent = colors?.accent || "#F97316";
  const secondary = colors?.secondary || "#F4F4F5";
  const headingFont = typography?.headingFont || "Helvetica Neue";
  const bodyFont = typography?.bodyFont || "Inter";

  return {
    "--bloom-background": bg,
    "--bloom-foreground": text,
    "--bloom-primary": accent,
    "--bloom-secondary": secondary,
    "--bloom-border": secondary,
    "--bloom-accent": `${accent}15`,
    "--font-heading": getFontStack(headingFont),
    "--font-body": getFontStack(bodyFont),
  } as React.CSSProperties;
}

export function getBloomFontsLink(typography: any) {
  const headingFont = typography?.headingFont || "Helvetica Neue";
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
  // Filter products by category query param if present
  const filteredProducts = store.products.filter((p) => {
    if (!initialCategory || initialCategory === "all") return true;
    return p.categoryId === initialCategory;
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
      
      <main className="flex-grow bg-bloom-background px-4 py-8 sm:py-12 lg:py-16 lg:px-8">
        <div className="text-center mx-auto mb-12 space-y-4 max-w-3xl">
          <h1 className="text-bloom-foreground leading-tighter text-4xl sm:text-5xl font-bold tracking-tight font-heading">
            {store.appearance.branding.tagline || "Discover Premium Curation"}
          </h1>
          <p className="text-bloom-foreground text-sm font-body max-w-2xl mx-auto sm:text-base opacity-80">
            {store.appearance.branding.description || "Discover our latest collection of premium products — comfort, design, and performance in every pair."}
          </p>
          
          {/* Categories Quick Filter */}
          {store.categories.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2 pt-6">
              <Link
                href={basePath || "/"}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  (!initialCategory || initialCategory === "all")
                    ? "bg-bloom-primary text-white border-transparent"
                    : "bg-bloom-secondary text-bloom-foreground border-bloom-border hover:bg-bloom-secondary/80"
                }`}
              >
                All
              </Link>
              {store.categories.map((c) => (
                <Link
                  key={c.id}
                  href={`${basePath || ""}?category=${c.id}`}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    initialCategory === c.id
                      ? "bg-bloom-primary text-white border-transparent"
                      : "bg-bloom-secondary text-bloom-foreground border-bloom-border hover:bg-bloom-secondary/80"
                  }`}
                >
                  {c.name}
                </Link>
              ))}
            </div>
          )}
        </div>

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
