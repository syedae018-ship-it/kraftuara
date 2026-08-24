"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Search,
  ShoppingBag,
  ArrowRight,
  Sparkles,
  Instagram,
  Package,
  Heart,
  Eye,
  Layers,
  Star,
} from "lucide-react";
import { useDemo } from "@/context/demo-context";
import { StoreData } from "@/lib/repositories/storefront-repository";
import { Button } from "@/components/ui/button";
import { formatCurrency, cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { StoreSearch } from "@/components/storefront/store-search";

export function CreativeStore({ store }: { store: StoreData }) {
  const { themeConfig, addToCart, setCartOpen } = useDemo();
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [wishlist, setWishlist] = useState<Record<string, boolean>>({});

  const storeTitle = themeConfig.storeTitle || store.name;
  const primaryColor = themeConfig.primaryColor || "#8B5CF6";
  const isDark = themeConfig.mode === "dark";

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

  const filteredProducts =
    selectedCategory === "all"
      ? store.products
      : store.products.filter((p) => p.categoryId === selectedCategory);

  const toggleWishlist = (id: string, name: string) => {
    const updated = !wishlist[id];
    setWishlist((prev) => ({ ...prev, [id]: updated }));
    if (updated) {
      toast.success("Saved to Wishlist", `${name} added to your wishlist.`);
    }
  };

  const lookbookImages = [
    {
      title: "Autumn Editorial Issue 04",
      subtitle: "Tokyo Streetwear & Heavyweight Organic Fleece",
      img: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=1000",
    },
    {
      title: "Sculptural Jewelry & Silver",
      subtitle: "Hand-finished 925 Solid Sterling Chains",
      img: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=1000",
    },
  ];

  return (
    <div
      className={cn(
        "min-h-screen flex flex-col justify-between font-sans transition-colors duration-300",
        isDark ? "bg-[#0E0C12] text-white" : "bg-[#FAF9F6] text-stone-900"
      )}
    >
      {/* 1. EDITORIAL TICKER BAR */}
      <div
        className="py-2.5 px-4 text-center text-xs font-serif italic tracking-widest text-white overflow-hidden"
        style={{ backgroundColor: primaryColor }}
      >
        <span>
          ✦ Limited Edition Capsule 04 Drop — Complimentary Worldwide Express Shipping ✦
        </span>
      </div>

      {/* 2. CREATIVE MAGAZINE NAVBAR */}
      <header
        className={cn(
          "sticky top-11 z-30 h-20 w-full border-b backdrop-blur-md px-6 lg:px-12 flex items-center justify-between transition-all",
          isDark
            ? "border-stone-800 bg-[#0E0C12]/90"
            : "border-stone-200 bg-[#FAF9F6]/90"
        )}
      >
        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-mono uppercase tracking-widest">
          <a href="#hero" className="hover:text-purple-600 transition-colors">
            Home
          </a>
          <a href="#lookbook" className="hover:text-purple-600 transition-colors">
            Lookbook
          </a>
          <a href="#products" className="hover:text-purple-600 transition-colors">
            Shop Capsule
          </a>
          <a href="#story" className="hover:text-purple-600 transition-colors">
            Manifesto
          </a>
        </nav>

        {/* Center: Brand Logo */}
        <Link href="/demo/creative" className="flex flex-col items-center group">
          <span className="text-2xl sm:text-3xl font-extrabold font-serif italic tracking-tight group-hover:scale-105 transition-transform">
            {storeTitle}
          </span>
          <span
            className="text-[9px] font-mono uppercase tracking-[0.4em] block -mt-1"
            style={{ color: primaryColor }}
          >
            Boutique Studio
          </span>
        </Link>

        {/* Search & Cart */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSearchOpen(true)}
            className={cn(
              "p-2.5 rounded-xl border transition-colors",
              isDark
                ? "border-stone-800 hover:bg-stone-800 text-stone-300"
                : "border-stone-300 hover:bg-stone-200/60 text-stone-800"
            )}
          >
            <Search className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCartOpen(true)}
            className={cn(
              "p-2.5 rounded-xl border transition-colors flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-white shadow-md",
              getButtonRadius()
            )}
            style={{ backgroundColor: primaryColor }}
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">Cart</span>
          </button>
        </div>
      </header>

      {/* 3. EDITORIAL CREATIVE HERO SECTION */}
      <section id="hero" className="py-16 lg:py-28 px-6 lg:px-12 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6 text-left">
            <span
              className="text-xs font-mono uppercase tracking-[0.3em] font-bold px-3 py-1 rounded-full border border-current inline-block"
              style={{ color: primaryColor }}
            >
              Autumn Lookbook 2026
            </span>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-serif tracking-tight leading-tight">
              Wearable Art & <br />
              <span className="italic font-extrabold underline decoration-wavy" style={{ textDecorationColor: primaryColor }}>
                Contemporary Garments
              </span>
            </h1>

            <p
              className={cn(
                "text-xs sm:text-sm font-sans max-w-xl leading-relaxed tracking-wide",
                isDark ? "text-stone-400" : "text-stone-600"
              )}
            >
              Artisanal streetwear, sculpted 925 sterling silver jewelry, and Portuguese organic fleece tailored for creative minds.
            </p>

            <div className="pt-4 flex flex-wrap items-center gap-4">
              <a href="#products">
                <Button
                  size="lg"
                  className={cn("px-8 text-xs font-mono font-bold uppercase tracking-widest text-white shadow-lg", getButtonRadius())}
                  style={{ backgroundColor: primaryColor }}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Shop The Capsule
                </Button>
              </a>
              <a href="#lookbook">
                <Button
                  variant="outline"
                  size="lg"
                  className={cn(
                    "px-8 text-xs font-mono font-bold uppercase tracking-widest",
                    getRadiusClass(),
                    isDark ? "border-stone-800 text-stone-300" : "border-stone-300 text-stone-800"
                  )}
                >
                  View Editorial
                </Button>
              </a>
            </div>
          </div>

          <div className="lg:col-span-5 flex justify-center">
            <div
              className={cn(
                "relative p-4 border shadow-2xl overflow-hidden aspect-[4/5] w-full max-w-md bg-stone-900 group",
                getRadiusClass(),
                isDark ? "border-stone-800" : "border-stone-200"
              )}
            >
              <img
                src="https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=900"
                alt="Creative Hoodie Editorial"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 rounded-lg"
              />
              <div className="absolute bottom-6 left-6 right-6 p-4 bg-black/75 backdrop-blur-md rounded-xl text-white text-left space-y-1">
                <span className="text-[10px] font-mono uppercase text-purple-400 font-bold">
                  Featured Capsule
                </span>
                <h4 className="text-sm font-bold font-serif italic">
                  Architectural Fleece Series
                </h4>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. MAGAZINE LOOKBOOK SECTION */}
      <section id="lookbook" className={cn("py-20 px-6 lg:px-12 border-y", isDark ? "border-stone-800 bg-[#0B090E]" : "border-stone-200 bg-stone-100")}>
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <span className="text-xs font-mono uppercase tracking-widest" style={{ color: primaryColor }}>
              Magazine Feature
            </span>
            <h2 className="text-3xl sm:text-5xl font-serif italic font-bold">Editorial Lookbooks</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {lookbookImages.map((lb, idx) => (
              <div
                key={idx}
                className={cn(
                  "group relative h-[420px] overflow-hidden border shadow-2xl flex flex-col justify-end p-8 text-left",
                  getRadiusClass(),
                  isDark ? "border-stone-800 bg-stone-900" : "border-stone-200 bg-white"
                )}
              >
                <img
                  src={lb.img}
                  alt={lb.title}
                  className="absolute inset-0 w-full h-full object-cover opacity-75 group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

                <div className="relative z-10 space-y-2 text-white">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-purple-400 font-bold">
                    Issue 0{idx + 1}
                  </span>
                  <h3 className="text-2xl font-serif italic font-extrabold">{lb.title}</h3>
                  <p className="text-xs text-stone-300 font-sans">{lb.subtitle}</p>
                  <div className="pt-2">
                    <a href="#products">
                      <span className="inline-flex items-center gap-2 text-xs font-mono uppercase font-bold text-purple-400 group-hover:translate-x-1 transition-transform">
                        Explore Looks <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. FEATURED CREATIVE PRODUCTS (9+ Items with Add to Cart & Buy Now) */}
      <section id="products" className="py-20 px-6 lg:px-12 max-w-7xl mx-auto space-y-10 w-full">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b pb-6 border-stone-800/40">
          <div className="text-left space-y-1">
            <span className="text-xs font-mono uppercase tracking-widest" style={{ color: primaryColor }}>
              Capsule Collection
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif italic font-bold">Artisanal Products</h2>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
            <button
              onClick={() => setSelectedCategory("all")}
              className={cn(
                "px-4 py-2 text-xs font-mono uppercase tracking-wider font-bold transition-all whitespace-nowrap",
                getRadiusClass(),
                selectedCategory === "all"
                  ? "bg-purple-600 text-white shadow-md"
                  : isDark
                  ? "bg-stone-900 border border-stone-800 text-stone-400"
                  : "bg-white border border-stone-200 text-stone-700"
              )}
              style={selectedCategory === "all" ? { backgroundColor: primaryColor } : undefined}
            >
              All Pieces ({store.products.length})
            </button>
            {store.categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={cn(
                  "px-4 py-2 text-xs font-mono uppercase tracking-wider font-bold transition-all whitespace-nowrap",
                  getRadiusClass(),
                  selectedCategory === c.id
                    ? "bg-purple-600 text-white shadow-md"
                    : isDark
                    ? "bg-stone-900 border border-stone-800 text-stone-400"
                    : "bg-white border border-stone-200 text-stone-700"
                )}
                style={selectedCategory === c.id ? { backgroundColor: primaryColor } : undefined}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.map((product) => {
            const coverImage =
              product.images.find((img) => img.isCover) || product.images[0];
            const isLiked = wishlist[product.id];

            return (
              <div
                key={product.id}
                className={cn(
                  "group border p-5 flex flex-col justify-between space-y-4 transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1.5 relative",
                  getRadiusClass(),
                  isDark
                    ? "bg-stone-900/60 border-stone-800 hover:border-purple-500/40"
                    : "bg-white border-stone-200 hover:border-purple-400"
                )}
              >
                {/* Wishlist Heart Action */}
                <button
                  onClick={() => toggleWishlist(product.id, product.name)}
                  className="absolute top-8 right-8 z-10 p-2 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white hover:bg-black/70 transition-all"
                  title="Save to Wishlist"
                >
                  <Heart
                    className={cn(
                      "w-4 h-4 transition-colors",
                      isLiked ? "fill-red-500 text-red-500" : "text-white"
                    )}
                  />
                </button>

                <Link
                  href={`/demo/creative/product/${product.slug}`}
                  className="aspect-[4/5] w-full rounded-xl overflow-hidden bg-stone-950/20 border border-stone-200/10 relative block"
                >
                  {coverImage ? (
                    <img
                      src={coverImage.url}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-500">
                      <Package className="w-10 h-10" />
                    </div>
                  )}

                  {product.featured && (
                    <span className="absolute top-3 left-3 bg-purple-600 text-white text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-md shadow-sm">
                      Boutique Drop
                    </span>
                  )}
                </Link>

                <div className="space-y-2 text-left flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-500">
                      {product.categoryName}
                    </span>
                    <Link href={`/demo/creative/product/${product.slug}`}>
                      <h3 className="text-lg font-serif italic font-bold hover:text-purple-600 transition-colors line-clamp-1">
                        {product.name}
                      </h3>
                    </Link>
                    <p
                      className={cn(
                        "text-xs font-sans line-clamp-2 leading-relaxed",
                        isDark ? "text-stone-400" : "text-stone-600"
                      )}
                    >
                      {product.shortDescription}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-stone-800/20 flex items-baseline justify-between">
                    <span className="text-xl font-bold font-serif">
                      {formatCurrency(product.price)}
                    </span>
                    {product.compareAtPrice && (
                      <span className="text-xs text-stone-400 line-through font-mono">
                        {formatCurrency(product.compareAtPrice)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      addToCart(product, 1);
                      toast.success("Added to Cart", `${product.name} added to your cart.`);
                    }}
                    className={cn(
                      "w-full text-xs font-mono font-bold uppercase tracking-wider",
                      isDark ? "border-stone-800 text-stone-300" : "border-stone-300 text-stone-800",
                      getButtonRadius()
                    )}
                  >
                    Add to Cart
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      addToCart(product, 1);
                      toast.success("Instant Order Initiated", `Proceeding to checkout for ${product.name}`);
                    }}
                    className={cn("w-full text-xs font-mono font-bold uppercase tracking-wider text-white shadow-md", getButtonRadius())}
                    style={{ backgroundColor: primaryColor }}
                  >
                    Buy Now
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. BRAND STORY MANIFESTO */}
      <section id="story" className={cn("py-20 px-6 lg:px-12 border-t", isDark ? "border-stone-800 bg-stone-950" : "border-stone-200 bg-stone-100")}>
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <span className="text-xs font-mono uppercase tracking-widest text-purple-500 font-bold">
            Studio Manifesto
          </span>
          <h2 className="text-3xl sm:text-5xl font-serif italic font-extrabold leading-tight">
            &quot;Fast Fashion is Obsolete. We Create Timeless Sculptural Garments.&quot;
          </h2>
          <p className={cn("text-xs sm:text-sm font-sans leading-relaxed max-w-2xl mx-auto", isDark ? "text-stone-400" : "text-stone-600")}>
            Every silhouette is engineered in small limited batches using sustainable European textiles. We eliminate intermediaries to bring haute design directly to your wardrobe.
          </p>
        </div>
      </section>

      {/* 7. INSTAGRAM GALLERY */}
      <section className="py-16 px-6 lg:px-12 max-w-7xl mx-auto text-center space-y-8">
        <div className="space-y-1">
          <span className="text-xs font-mono uppercase tracking-widest text-purple-500 font-bold">
            @CreativeThreadsStudio
          </span>
          <h2 className="text-2xl sm:text-4xl font-serif italic font-bold">Instagram Lookbook</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600",
            "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600",
            "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600",
            "https://images.unsplash.com/photo-1591561954557-26941169b49e?w=600",
            "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600",
            "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600",
          ].map((url, idx) => (
            <div
              key={idx}
              className="group relative aspect-square rounded-2xl overflow-hidden border border-stone-200/20 bg-black cursor-pointer"
            >
              <img
                src={url}
                alt="Instagram Look"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-85 group-hover:opacity-100"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-purple-400">
                <Instagram className="w-6 h-6" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 8. CREATIVE FOOTER */}
      <footer className={cn("border-t pt-16 pb-8 px-6 lg:px-12 font-sans text-xs", isDark ? "bg-[#09070C] border-stone-800 text-stone-400" : "bg-[#FAF9F6] border-stone-200 text-stone-600")}>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 pb-12 border-b border-stone-800/20">
          <div className="space-y-3 md:col-span-2 text-left">
            <h4 className="text-xl font-bold font-serif italic text-purple-600">{storeTitle}</h4>
            <p className="text-xs leading-relaxed max-w-md">
              Creative fashion & lifestyle boutique offering organic heavyweight fleece, artisanal silver jewelry, and footwear drops.
            </p>
          </div>

          <div className="space-y-3 text-left">
            <h5 className="font-bold font-mono uppercase tracking-wider text-[11px]">Index</h5>
            <ul className="space-y-2">
              <li><a href="#hero" className="hover:text-purple-600 transition-colors">Home</a></li>
              <li><a href="#lookbook" className="hover:text-purple-600 transition-colors">Lookbook</a></li>
              <li><a href="#products" className="hover:text-purple-600 transition-colors">Capsule Drop</a></li>
              <li><a href="#story" className="hover:text-purple-600 transition-colors">Manifesto</a></li>
            </ul>
          </div>

          <div className="space-y-3 text-left">
            <h5 className="font-bold font-mono uppercase tracking-wider text-[11px]">Studio Inquiries</h5>
            <p>Tokyo • London • New York</p>
            <p className="font-mono font-semibold text-purple-600">hello@{storeTitle.toLowerCase().replace(/[^a-z]/g, "")}.com</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <span>© {new Date().getFullYear()} {storeTitle}. All Rights Reserved.</span>
          <span className="text-[11px] font-mono text-stone-400">Live Demo E-Commerce Store</span>
        </div>
      </footer>

      {/* Store Search Modal */}
      <StoreSearch
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        products={store.products}
        storeSlug="creative"
      />
    </div>
  );
}
