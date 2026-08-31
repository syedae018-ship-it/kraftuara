"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Search,
  ShoppingBag,
  Menu,
  X,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Star,
  Instagram,
  Package,
  CheckCircle2,
} from "lucide-react";
import { useDemo } from "@/context/demo-context";
import { StoreData } from "@/lib/repositories/storefront-repository";
import { Product } from "@/types/product";
import { Button } from "@/components/ui/button";
import { formatCurrency, cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { StoreSearch } from "@/components/storefront/store-search";

export function LuxuryStore({ store }: { store: StoreData }) {
  const { themeConfig, addToCart, setCartOpen } = useDemo();
  const [sidebarNavOpen, setSidebarNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const storeTitle = themeConfig.storeTitle || store.name;
  const primaryColor = themeConfig.primaryColor || "#E67E22";
  const isLight = themeConfig.mode === "light";

  // Dynamic radius class helper
  const getRadiusClass = () => {
    if (themeConfig.borderRadius === "full") return "rounded-3xl";
    if (themeConfig.borderRadius === "rounded") return "rounded-2xl";
    if (themeConfig.borderRadius === "soft") return "rounded-xl";
    return "rounded-none";
  };

  const getButtonRadius = () => {
    if (themeConfig.buttonStyle === "pill") return "rounded-full";
    if (themeConfig.buttonStyle === "rounded") return "rounded-xl";
    if (themeConfig.buttonStyle === "sharp") return "rounded-none";
    return "rounded-lg border border-current bg-transparent";
  };

  // Filter products by selected category
  const filteredProducts =
    selectedCategory === "all"
      ? store.products
      : store.products.filter((p) => p.categoryId === selectedCategory);

  const instagramPosts = [
    "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=600",
    "https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=600",
    "https://images.unsplash.com/photo-1616949755610-8c9bbc08f138?w=600",
    "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?w=600",
    "https://images.unsplash.com/photo-1547887537-6158d64c35b3?w=600",
    "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=600",
  ];

  return (
    <div
      className={cn(
        "min-h-screen flex flex-col justify-between font-serif transition-colors duration-300",
        isLight ? "bg-[#FDFBF7] text-zinc-900" : "bg-[#080808] text-white"
      )}
    >
      {/* 1. ANNOUNCEMENT BAR */}
      <div
        className="py-2 px-4 text-center text-xs font-heading font-medium uppercase tracking-widest text-black"
        style={{ backgroundColor: primaryColor }}
      >
        <span className="flex items-center justify-center gap-2">
          <Sparkles className="w-3.5 h-3.5" /> Complimentary Royal Oud Discovery Atomizer With Every Order
        </span>
      </div>

      {/* 2. LUXURY NAVIGATION HEADER */}
      <header
        className={cn(
          "sticky top-11 z-30 h-20 w-full border-b backdrop-blur-md px-6 lg:px-12 flex items-center justify-between transition-all",
          isLight ? "border-zinc-200 bg-[#FDFBF7]/90" : "border-white/10 bg-[#080808]/90"
        )}
      >
        {/* Left: Sidebar Navigation Trigger */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarNavOpen(true)}
            className={cn(
              "p-2.5 rounded-xl border transition-colors flex items-center gap-2 text-xs uppercase tracking-wider font-heading font-semibold",
              isLight
                ? "border-zinc-300 hover:bg-zinc-100 text-zinc-800"
                : "border-white/10 hover:bg-white/5 text-zinc-300 hover:text-white"
            )}
          >
            <Menu className="w-4 h-4" /> Menu
          </button>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-8 text-xs font-heading font-semibold uppercase tracking-widest">
            <a href="#hero" className="hover:text-amber-500 transition-colors">
              Home
            </a>
            <a href="#collections" className="hover:text-amber-500 transition-colors">
              Collections
            </a>
            <a href="#about" className="hover:text-amber-500 transition-colors">
              About Us
            </a>
            <a href="#contact" className="hover:text-amber-500 transition-colors">
              Contact Us
            </a>
          </nav>
        </div>

        {/* Center: Brand Logo */}
        <Link href="/demo/luxury" className="flex flex-col items-center text-center group">
          <span
            className="text-xl sm:text-2xl font-bold font-serif tracking-widest uppercase"
            style={{ color: isLight ? "#111" : "#FFF" }}
          >
            {storeTitle}
          </span>
          <span
            className="text-[9px] font-mono uppercase tracking-[0.3em] -mt-1 block"
            style={{ color: primaryColor }}
          >
            Haute Parfumerie
          </span>
        </Link>

        {/* Right: Search & Cart */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSearchOpen(true)}
            className={cn(
              "p-2.5 rounded-xl border transition-colors",
              isLight ? "border-zinc-300 hover:bg-zinc-100 text-zinc-800" : "border-white/10 hover:bg-white/5 text-zinc-300 hover:text-white"
            )}
          >
            <Search className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCartOpen(true)}
            className={cn(
              "p-2.5 rounded-xl border transition-colors flex items-center gap-2 text-xs font-heading font-semibold uppercase tracking-wider",
              isLight ? "border-zinc-300 hover:bg-zinc-100 text-zinc-800" : "border-white/10 hover:bg-white/5 text-zinc-300 hover:text-white"
            )}
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">Bag</span>
          </button>
        </div>
      </header>

      {/* 3. SIDEBAR NAVIGATION DRAWER (Inspired by luxury fashion brands) */}
      {sidebarNavOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            onClick={() => setSidebarNavOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
          />
          <div
            className={cn(
              "relative z-50 w-full max-w-sm h-full p-8 flex flex-col justify-between shadow-2xl font-body transition-all",
              isLight ? "bg-white text-zinc-900 border-r border-zinc-200" : "bg-[#0c0c0d] text-white border-r border-white/10"
            )}
          >
            <div className="space-y-8">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <span className="text-lg font-bold font-serif tracking-widest uppercase">{storeTitle}</span>
                <button
                  onClick={() => setSidebarNavOpen(false)}
                  className="p-2 rounded-xl text-zinc-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6 text-sm font-heading uppercase tracking-widest font-semibold">
                <a
                  href="#hero"
                  onClick={() => setSidebarNavOpen(false)}
                  className="block py-2 border-b border-white/5 hover:text-amber-500 transition-colors"
                >
                  Home
                </a>
                <a
                  href="#collections"
                  onClick={() => setSidebarNavOpen(false)}
                  className="block py-2 border-b border-white/5 hover:text-amber-500 transition-colors"
                >
                  Collections
                </a>
                <a
                  href="#products"
                  onClick={() => setSidebarNavOpen(false)}
                  className="block py-2 border-b border-white/5 hover:text-amber-500 transition-colors"
                >
                  All Products
                </a>
                <a
                  href="#about"
                  onClick={() => setSidebarNavOpen(false)}
                  className="block py-2 border-b border-white/5 hover:text-amber-500 transition-colors"
                >
                  About Us
                </a>
                <a
                  href="#contact"
                  onClick={() => setSidebarNavOpen(false)}
                  className="block py-2 border-b border-white/5 hover:text-amber-500 transition-colors"
                >
                  Contact Us
                </a>
              </div>
            </div>

            <div className="space-y-4 pt-6 border-t border-white/10 text-xs text-zinc-400">
              <p>Direct Atelier Inquiries:</p>
              <p className="font-mono text-white">concierge@{storeTitle.toLowerCase().replace(/[^a-z]/g, "")}.com</p>
              <div className="flex items-center gap-2 pt-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>100% Certified Authentic Rare Oud</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. LUXURY HERO SECTION */}
      <section id="hero" className="relative py-20 lg:py-32 px-6 lg:px-12 overflow-hidden text-center">
        {/* Glow backdrop */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] blur-[160px] pointer-events-none rounded-full opacity-20"
          style={{ backgroundColor: primaryColor }}
        />

        <div className="relative z-10 max-w-4xl mx-auto space-y-6">
          <span
            className="text-xs font-mono uppercase tracking-[0.4em] px-4 py-1.5 rounded-full border border-current inline-block"
            style={{ color: primaryColor }}
          >
            Private Royal Reserve 2026
          </span>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-serif font-bold tracking-tight leading-tight">
            The Essence of Pure <br />
            <span className="italic font-normal" style={{ color: primaryColor }}>
              Artisanal Oud & Attar
            </span>
          </h1>

          <p
            className={cn(
              "text-xs sm:text-sm font-sans max-w-xl mx-auto leading-relaxed tracking-wide",
              isLight ? "text-zinc-600" : "text-zinc-400"
            )}
          >
            Distilled from wild aged trees in Assam and Cambodia. Hand-bottled in gold-embossed crystal vessels for true fragrance connoisseurs.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <a href="#products">
              <Button
                size="lg"
                className={cn("px-8 text-xs uppercase tracking-widest font-heading font-bold shadow-glow", getButtonRadius())}
                style={{ backgroundColor: primaryColor, color: "#000" }}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Explore Private Collection
              </Button>
            </a>
            <a href="#about">
              <Button
                variant="outline"
                size="lg"
                className={cn("px-8 text-xs uppercase tracking-widest font-heading font-semibold border-white/20", getButtonRadius())}
              >
                Our Heritage
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* 5. FEATURED COLLECTIONS SECTION */}
      <section id="collections" className="py-16 px-6 lg:px-12 max-w-7xl mx-auto space-y-8 w-full">
        <div className="text-center space-y-2">
          <span className="text-[11px] font-mono uppercase tracking-widest" style={{ color: primaryColor }}>
            Curated Vaults
          </span>
          <h2 className="text-2xl sm:text-4xl font-serif font-bold tracking-tight">Featured Collections</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {store.collections.map((col) => (
            <div
              key={col.id}
              className={cn(
                "group relative h-80 overflow-hidden border transition-all flex flex-col justify-end p-8 shadow-2xl",
                getRadiusClass(),
                isLight ? "border-zinc-200 bg-zinc-100" : "border-white/10 bg-[#111]"
              )}
            >
              {col.coverImage && (
                <img
                  src={col.coverImage}
                  alt={col.name}
                  className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-700"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

              <div className="relative z-10 space-y-2 text-white text-left">
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400">
                  {col.productCount} Rare Formulations
                </span>
                <h3 className="text-2xl font-serif font-bold">{col.name}</h3>
                <p className="text-xs text-zinc-300 font-sans line-clamp-2 max-w-md">{col.description}</p>
                <div className="pt-2">
                  <a href="#products">
                    <span className="inline-flex items-center gap-2 text-xs font-heading font-bold uppercase tracking-wider text-amber-400 group-hover:translate-x-1 transition-transform">
                      View Collection <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. ABOUT BRAND SECTION */}
      <section id="about" className={cn("py-20 px-6 lg:px-12 border-y", isLight ? "border-zinc-200 bg-zinc-50" : "border-white/10 bg-[#0d0d0e]")}>
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6 text-left">
            <span className="text-xs font-mono uppercase tracking-[0.3em]" style={{ color: primaryColor }}>
              Established 1994
            </span>
            <h2 className="text-3xl sm:text-5xl font-serif font-bold leading-tight">
              Three Decades of Uncompromising Oud Craftsmanship
            </h2>
            <p className={cn("text-xs sm:text-sm font-sans leading-relaxed", isLight ? "text-zinc-600" : "text-zinc-400")}>
              Every bottle produced in our atelier undergoes a minimum of 18 months of natural aging. We source raw resin chips directly from sustainable forest preserves across South Asia.
            </p>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10 font-sans">
              <div>
                <span className="text-2xl font-serif font-bold text-amber-400">100% Pure</span>
                <p className="text-xs text-zinc-400 mt-1">Zero synthetic fixatives or alcohol fillers.</p>
              </div>
              <div>
                <span className="text-2xl font-serif font-bold text-amber-400">30+ Years</span>
                <p className="text-xs text-zinc-400 mt-1">Vintage agarwood woodchips maceration.</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 flex justify-center">
            <div className={cn("relative p-3 border shadow-2xl overflow-hidden aspect-square w-full max-w-md", getRadiusClass(), isLight ? "border-zinc-300" : "border-white/10 bg-[#151515]")}>
              <img
                src="https://images.unsplash.com/photo-1594035910387-fea47794261f?w=800"
                alt="Brand Craftsmanship"
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 7. FEATURED PRODUCTS (9+ Items with Add To Cart & Buy Now) */}
      <section id="products" className="py-20 px-6 lg:px-12 max-w-7xl mx-auto space-y-10 w-full">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div className="text-left space-y-1">
            <span className="text-xs font-mono uppercase tracking-widest" style={{ color: primaryColor }}>
              Catalog
            </span>
            <h2 className="text-2xl sm:text-4xl font-serif font-bold tracking-tight">The Royal Perfumery</h2>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 scrollbar-none no-scrollbar">
            <button
              onClick={() => setSelectedCategory("all")}
              className={cn(
                "shrink-0 h-8 sm:h-9 px-4 py-1.5 text-xs uppercase tracking-widest font-heading font-semibold transition-all whitespace-nowrap active:scale-95 cursor-pointer",
                getRadiusClass(),
                selectedCategory === "all"
                  ? "bg-amber-500 text-black shadow-glow font-bold"
                  : "bg-white/5 text-zinc-400 hover:text-white"
              )}
            >
              All Items ({store.products.length})
            </button>
            {store.categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={cn(
                  "shrink-0 h-8 sm:h-9 px-4 py-1.5 text-xs uppercase tracking-widest font-heading font-semibold transition-all whitespace-nowrap active:scale-95 cursor-pointer",
                  getRadiusClass(),
                  selectedCategory === c.id
                    ? "bg-amber-500 text-black shadow-glow font-bold"
                    : "bg-white/5 text-zinc-400 hover:text-white"
                )}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.map((product) => {
            const coverImage =
              product.images.find((img) => img.isCover) || product.images[0];

            return (
              <div
                key={product.id}
                className={cn(
                  "group relative border transition-all flex flex-col justify-between p-5 space-y-4 shadow-card hover:-translate-y-1.5 duration-300",
                  getRadiusClass(),
                  isLight
                    ? "bg-white border-zinc-200 hover:border-amber-600/40"
                    : "bg-[#111111] border-white/10 hover:border-amber-500/40"
                )}
              >
                {/* Product Image Link */}
                <Link
                  href={`/demo/luxury/product/${product.slug}`}
                  className="aspect-square w-full rounded-xl overflow-hidden bg-[#181818] border border-white/5 relative block"
                >
                  {coverImage ? (
                    <img
                      src={coverImage.url}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-600">
                      <Package className="w-10 h-10" />
                    </div>
                  )}

                  {product.featured && (
                    <span className="absolute top-3 left-3 bg-amber-500/90 text-black text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md font-heading">
                      Royal Reserve
                    </span>
                  )}
                </Link>

                {/* Info */}
                <div className="space-y-2 text-left flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-amber-500">
                      {product.categoryName}
                    </span>
                    <Link href={`/demo/luxury/product/${product.slug}`}>
                      <h3 className="text-base font-serif font-bold text-white hover:text-amber-400 transition-colors line-clamp-1">
                        {product.name}
                      </h3>
                    </Link>
                    <p className="text-xs text-zinc-400 font-sans line-clamp-2 leading-relaxed">
                      {product.shortDescription}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-white/10 flex items-baseline justify-between">
                    <span className="text-lg font-serif font-bold text-white">
                      {formatCurrency(product.price)}
                    </span>
                    {product.compareAtPrice && (
                      <span className="text-xs text-zinc-500 line-through">
                        {formatCurrency(product.compareAtPrice)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      addToCart(product, 1);
                      toast.success("Added to Bag", `${product.name} added to your bag.`);
                    }}
                    className={cn("w-full text-[11px] uppercase tracking-wider font-heading border-white/20", getButtonRadius())}
                  >
                    Add to Bag
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      addToCart(product, 1);
                      toast.success("Instant Order Initiated", `Proceeding to checkout for ${product.name}`);
                    }}
                    className={cn("w-full text-[11px] uppercase tracking-wider font-heading font-bold shadow-glow", getButtonRadius())}
                    style={{ backgroundColor: primaryColor, color: "#000" }}
                  >
                    Buy Now
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 8. INSTAGRAM SECTION */}
      <section className={cn("py-16 px-6 lg:px-12 border-t", isLight ? "border-zinc-200 bg-zinc-100" : "border-white/10 bg-[#0c0c0d]")}>
        <div className="max-w-7xl mx-auto space-y-8 text-center">
          <div className="space-y-1">
            <span className="text-xs font-mono uppercase tracking-widest text-amber-500">
              #AromaPerfumes
            </span>
            <h2 className="text-2xl sm:text-4xl font-serif font-bold tracking-tight">
              Follow Our Atelier Journal
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {instagramPosts.map((url, idx) => (
              <div
                key={idx}
                className="group relative aspect-square rounded-2xl overflow-hidden border border-white/10 bg-black cursor-pointer"
              >
                <img
                  src={url}
                  alt="Instagram Post"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-80 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-amber-400">
                  <Instagram className="w-6 h-6" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. TESTIMONIALS */}
      <section className="py-20 px-6 lg:px-12 max-w-6xl mx-auto text-center space-y-12">
        <div className="space-y-2">
          <span className="text-xs font-mono uppercase tracking-widest text-amber-500">
            Patron Reviews
          </span>
          <h2 className="text-2xl sm:text-4xl font-serif font-bold tracking-tight">
            Words From Fragrance Connoisseurs
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              quote: "The Royal Amber Oud Extrait is unparalleled. The dry-down lasts over 24 hours with magnificent sillage.",
              author: "Lord Harrison V.",
              title: "Collector, London",
            },
            {
              quote: "Packaging and crystalline bottle design matches top Parisian ateliers. True luxury delivery.",
              author: "Elena Rostova",
              title: "Fashion Editor, Milan",
            },
            {
              quote: "Distillation quality of the Taif Rose Attar is unmatched. Pure botanical art.",
              author: "Tariq Al-Mansoor",
              title: "Perfumer, Dubai",
            },
          ].map((t, idx) => (
            <div
              key={idx}
              className={cn(
                "p-8 border space-y-4 text-left flex flex-col justify-between shadow-card",
                getRadiusClass(),
                isLight ? "bg-white border-zinc-200" : "bg-[#111] border-white/10"
              )}
            >
              <div className="flex gap-1 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs sm:text-sm font-sans italic leading-relaxed text-zinc-300">
                &quot;{t.quote}&quot;
              </p>
              <div className="pt-2 border-t border-white/10">
                <p className="text-xs font-serif font-bold text-white">{t.author}</p>
                <p className="text-[10px] font-mono text-zinc-500">{t.title}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 10. LUXURY FOOTER */}
      <footer id="contact" className="bg-[#050505] border-t border-white/10 pt-16 pb-8 px-6 lg:px-12 font-sans text-xs text-zinc-400">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 pb-12 border-b border-white/10">
          <div className="space-y-4 md:col-span-2 text-left">
            <h4 className="text-xl font-bold font-serif text-white uppercase tracking-widest">{storeTitle}</h4>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-md">
              Private reserve parfumerie supplying royalty and connoisseurs across Europe, the Middle East, and Asia with authentic aged agarwood and steam-distilled attar oils.
            </p>
          </div>

          <div className="space-y-3 text-left">
            <h5 className="font-bold font-heading text-white uppercase tracking-wider text-[11px]">Navigation</h5>
            <ul className="space-y-2 text-zinc-400">
              <li><a href="#hero" className="hover:text-white transition-colors">Catalog Home</a></li>
              <li><a href="#collections" className="hover:text-white transition-colors">Curated Vaults</a></li>
              <li><a href="#products" className="hover:text-white transition-colors">All Fragrances</a></li>
              <li><a href="#about" className="hover:text-white transition-colors">Atelier Heritage</a></li>
            </ul>
          </div>

          <div className="space-y-3 text-left">
            <h5 className="font-bold font-heading text-white uppercase tracking-wider text-[11px]">Atelier Concierge</h5>
            <p className="text-zinc-400">Available Mon - Sat for private scent consultations.</p>
            <p className="font-mono text-white font-semibold">+971 4 800 9000</p>
            <p className="font-mono text-amber-400">concierge@{storeTitle.toLowerCase().replace(/[^a-z]/g, "")}.com</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <span>© {new Date().getFullYear()} {storeTitle}. All Rights Reserved.</span>
          <span className="text-[11px] text-zinc-500 font-mono">Live Demo E-Commerce Powered by Catalog SaaS</span>
        </div>
      </footer>

      {/* Store Search Modal */}
      <StoreSearch
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        products={store.products}
        storeSlug="luxury"
      />
    </div>
  );
}
