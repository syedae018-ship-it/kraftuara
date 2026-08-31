"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, ShoppingBag, MessageSquare, Menu, X, Truck } from "lucide-react";
import { StoreData } from "@/lib/repositories/storefront-repository";
import { WhatsAppButton } from "./whatsapp-button";
import { StoreSearch } from "./store-search";
import { cn } from "@/lib/utils";
import { getStoreBasePath } from "@/lib/urls";
import { resolveImageUrl } from "@/lib/image-resolver";
import { hasFeatureAccess } from "@/lib/feature-gating";

export interface StoreNavbarProps {

  store: StoreData;
  className?: string;
  isSubdomain?: boolean;
}

export function StoreNavbar({ store, className, isSubdomain = false }: StoreNavbarProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const pathname = usePathname();
  const isDemo = pathname?.startsWith("/demo");
  const demoTheme = pathname?.split("/")[2] || "luxury";
  const storePrefix = getStoreBasePath(store.slug, isSubdomain, isDemo, demoTheme);

  const { branding, colors } = store.appearance;

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-30 h-16 w-full border-b border-white/10 bg-[#080808]/85 backdrop-blur-md px-4 lg:px-8 flex items-center justify-between transition-all",
          className
        )}
      >
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-zinc-400 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link href={storePrefix} className="flex items-center gap-2.5 group">
            {branding.logoUrl && !logoError ? (
              <img
                src={resolveImageUrl(branding.logoUrl)}
                alt={store.name}
                className="w-8 h-8 rounded-lg object-cover"
                onError={() => setLogoError(true)}
              />
            ) : (
              <div
                className="w-8 h-8 rounded-lg border border-maroon-600/40 flex items-center justify-center text-white font-bold font-heading text-xs shadow-glow"
                style={{ backgroundColor: colors.primary }}
              >
                {store.name.charAt(0)}
              </div>
            )}
            <div className="hidden sm:block">
              <h1 className="text-sm font-bold font-heading text-white tracking-tight group-hover:text-maroon-300 transition-colors">
                {store.name}
              </h1>
              {branding.tagline && (
                <p className="text-[10px] text-zinc-400 font-body line-clamp-1">{branding.tagline}</p>
              )}
            </div>
          </Link>
        </div>

        {/* Desktop Category Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-heading font-medium">
          <Link href={storePrefix} className="text-white hover:text-maroon-300 transition-colors">
            Home
          </Link>
          {store.categories.slice(0, 4).map((c) => (
            <Link
              key={c.id}
              href={`${storePrefix}#category-${c.slug}`}
              className="text-zinc-400 hover:text-white transition-colors"
            >
              {c.name}
            </Link>
          ))}
          {store.collections.length > 0 && (
            <Link
              href={`${storePrefix}#collections`}
              className="text-zinc-400 hover:text-white transition-colors"
            >
              Collections
            </Link>
          )}
          {hasFeatureAccess(store.plan || "startup", "customer_order_tracking") && (
            <Link
              href={`${storePrefix}/track`}
              className="text-zinc-400 hover:text-white transition-colors"
            >
              Track Order
            </Link>
          )}

        </nav>


        {/* Search & WhatsApp CTA */}
        <div className="flex items-center gap-2.5">
          {hasFeatureAccess(store.plan || "startup", "customer_order_tracking") && (
            <Link
              href={`${storePrefix}/track`}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-white/10 bg-white/5 hover:bg-white/10 text-white transition-colors shadow-sm"
              aria-label="Track Order"
            >
              <Truck className="w-3.5 h-3.5 text-maroon-400" />
              <span>Track Order</span>
            </Link>
          )}

          <button
            onClick={() => setSearchOpen(true)}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors border border-white/10"
            aria-label="Search Catalog"
          >
            <Search className="w-4 h-4" />
          </button>

          <WhatsAppButton
            phone={branding.whatsapp || branding.phone}
            productName={store.products[0]?.name || "Luxury Oud"}
            price={store.products[0]?.price || 140}
            size="sm"
          />
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <nav
          className="md:hidden bg-[#111111] border-b border-white/10 px-4 py-3 space-y-2 animate-in slide-in-from-top-2 duration-200 z-20"
          role="navigation"
          aria-label="Mobile Navigation"
        >
          <Link
            href={storePrefix}
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 px-3 rounded-xl text-xs font-heading font-medium text-white hover:bg-white/5"
          >
            Home
          </Link>
          {store.categories.map((c) => (
            <Link
              key={c.id}
              href={`${storePrefix}#category-${c.slug}`}
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 px-3 rounded-xl text-xs font-heading font-medium text-zinc-400 hover:text-white hover:bg-white/5"
            >
              {c.name}
            </Link>
          ))}
          {store.collections.length > 0 && (
            <Link
              href={`${storePrefix}#collections`}
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 px-3 rounded-xl text-xs font-heading font-medium text-zinc-400 hover:text-white hover:bg-white/5"
            >
              Collections
            </Link>
          )}
          {hasFeatureAccess(store.plan || "startup", "customer_order_tracking") && (
            <Link
              href={`${storePrefix}/track`}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 py-2 px-3 rounded-xl text-xs font-heading font-medium text-maroon-300 hover:text-white bg-maroon-950/40 border border-maroon-800/40"
            >
              <Truck className="w-3.5 h-3.5 text-maroon-400" />
              <span>Track Order</span>
            </Link>
          )}
        </nav>
      )}

      <StoreSearch
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        products={store.products}
        storeSlug={store.slug}
        isSubdomain={isSubdomain}
      />
    </>
  );
}
