"use client";

import React, { useState, useEffect } from "react";
import { StoreData } from "@/types/store";
import { initialAppearanceSettings } from "@/lib/repositories/appearance-repository";
import { AnnouncementBar } from "./announcement-bar";
import { StoreNavbar } from "./store-navbar";
import { HeroSection } from "./hero-section";
import { CategorySection } from "./category-section";
import { CollectionSection } from "./collection-section";
import { ProductGrid } from "./product-grid";
import { TestimonialsSection, AboutSection } from "./testimonials-section";
import { StoreFooter } from "./store-footer";

export interface StoreRendererProps {
  store: StoreData;
  initialCategory?: string;
  initialCollection?: string;
  isSubdomain?: boolean;
}

export function StoreRenderer({ store, initialCategory, initialCollection, isSubdomain = false }: StoreRendererProps) {
  const { appearance } = store;
  const sectionsList = (appearance?.homepageSections && Array.isArray(appearance.homepageSections))
    ? appearance.homepageSections
    : initialAppearanceSettings.homepageSections;

  const sortedSections = [...sectionsList]
    .filter((s) => s?.enabled)
    .sort((a, b) => (a?.order || 0) - (b?.order || 0));

  return (
    <div className="min-h-screen bg-[#080808] text-white selection:bg-maroon-800 selection:text-white flex flex-col justify-between">
      <div className="space-y-0">
        <AnnouncementBar />
        <StoreNavbar store={store} isSubdomain={isSubdomain} />

        <main className="space-y-4">
          {sortedSections.map((sec) => {
            switch (sec.id) {
              case "hero":
                return <HeroSection key={sec.id} store={store} />;

              case "categories":
                return (
                  <CategorySection
                    key={sec.id}
                    categories={store.categories}
                    storeSlug={store.slug}
                    isSubdomain={isSubdomain}
                  />
                );

              case "collections":
                return (
                  <CollectionSection
                    key={sec.id}
                    collections={store.collections}
                    storeSlug={store.slug}
                    isSubdomain={isSubdomain}
                  />
                );

              case "featured_products":
                return (
                  <ProductGrid
                    key={sec.id}
                    products={store.products}
                    categories={store.categories}
                    collections={store.collections}
                    storeSlug={store.slug}
                    whatsappPhone={appearance.branding.whatsapp || appearance.branding.phone}
                    initialCategory={initialCategory}
                    initialCollection={initialCollection}
                    isSubdomain={isSubdomain}
                  />
                );

              case "testimonials":
                return <TestimonialsSection key={sec.id} />;

              case "about":
                return <AboutSection key={sec.id} storeName={store.name} />;

              default:
                return null;
            }
          })}
        </main>
      </div>

      <StoreFooter store={store} isSubdomain={isSubdomain} />
    </div>
  );
}
