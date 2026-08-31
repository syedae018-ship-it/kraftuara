"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Search,
  ShoppingBag,
  Zap,
  ArrowRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  Sparkles,
  Package,
  Mail,
  CheckCircle2,
} from "lucide-react";
import { useDemo } from "@/context/demo-context";
import { StoreData } from "@/lib/repositories/storefront-repository";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency, cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { StoreSearch } from "@/components/storefront/store-search";

export function ModernStore({ store }: { store: StoreData }) {
  const { themeConfig, addToCart, setCartOpen } = useDemo();
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [newsletterEmail, setNewsletterEmail] = useState("");

  const storeTitle = themeConfig.storeTitle || store.name;
  const primaryColor = themeConfig.primaryColor || "#0070F3";
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

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    toast.success(
      "Subscribed to Flash Deals!",
      `We'll send tech drop notifications to ${newsletterEmail}`
    );
    setNewsletterEmail("");
  };

  return (
    <div
      className={cn(
        "min-h-screen flex flex-col justify-between font-sans transition-colors duration-300",
        isDark ? "bg-[#0B0F19] text-white" : "bg-[#F8FAFC] text-slate-900"
      )}
    >
      {/* 1. TOP UTILITY ANNOUNCEMENT BAR */}
      <div
        className="py-2 px-4 text-center text-xs font-semibold uppercase tracking-wider text-white"
        style={{ backgroundColor: primaryColor }}
      >
        <span className="flex items-center justify-center gap-2">
          <Zap className="w-3.5 h-3.5 fill-white" /> Express 24-Hour Express Shipping on All Tech Orders
        </span>
      </div>

      {/* 2. MODERN NAVBAR HEADER */}
      <header
        className={cn(
          "sticky top-11 z-30 h-16 w-full border-b backdrop-blur-md px-6 lg:px-12 flex items-center justify-between transition-all",
          isDark
            ? "border-slate-800 bg-[#0B0F19]/90"
            : "border-slate-200 bg-white/90"
        )}
      >
        {/* Brand Logo & Name */}
        <Link href="/demo/modern" className="flex items-center gap-3 group">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold font-heading text-sm shadow-md"
            style={{ backgroundColor: primaryColor }}
          >
            {storeTitle.charAt(0)}
          </div>
          <div>
            <h1 className="text-base font-bold font-heading tracking-tight group-hover:text-blue-600 transition-colors">
              {storeTitle}
            </h1>
            <span className="text-[10px] font-mono text-slate-400 block -mt-1">
              Next-Gen Electronics
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-heading font-bold uppercase tracking-wider">
          <a href="#hero" className="hover:text-blue-600 transition-colors">
            Home
          </a>
          <a href="#categories" className="hover:text-blue-600 transition-colors">
            Categories
          </a>
          <a href="#products" className="hover:text-blue-600 transition-colors">
            Products
          </a>
          <a href="#newsletter" className="hover:text-blue-600 transition-colors">
            Flash Deals
          </a>
        </nav>

        {/* Search & Cart */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setSearchOpen(true)}
            className={cn(
              "p-2 rounded-xl border transition-colors flex items-center gap-2 text-xs font-semibold",
              isDark
                ? "border-slate-800 hover:bg-slate-800 text-slate-300"
                : "border-slate-200 hover:bg-slate-100 text-slate-700"
            )}
          >
            <Search className="w-4 h-4 text-blue-500" />
            <span className="hidden sm:inline">Search Tech</span>
          </button>
          <button
            onClick={() => setCartOpen(true)}
            className={cn(
              "p-2 rounded-xl border transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white shadow-sm",
              getButtonRadius()
            )}
            style={{ backgroundColor: primaryColor }}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Cart</span>
          </button>
        </div>
      </header>

      {/* 3. MINIMAL HERO SECTION */}
      <section id="hero" className="py-12 lg:py-20 px-6 lg:px-12 max-w-7xl mx-auto w-full">
        <div
          className={cn(
            "relative p-8 sm:p-12 lg:p-16 border overflow-hidden shadow-xl flex flex-col lg:flex-row items-center justify-between gap-12",
            getRadiusClass(),
            isDark
              ? "bg-slate-900/60 border-slate-800"
              : "bg-white border-slate-200"
          )}
        >
          {/* Subtle Ambient Glow */}
          <div
            className="absolute -right-20 -bottom-20 w-96 h-96 blur-[120px] pointer-events-none rounded-full opacity-15"
            style={{ backgroundColor: primaryColor }}
          />

          <div className="space-y-6 text-left max-w-2xl relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 text-xs font-mono font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> 2026 Innovation Showcase
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold font-heading tracking-tight leading-tight">
              Upgrade Your Work & Studio Tech
            </h1>

            <p
              className={cn(
                "text-xs sm:text-sm font-sans leading-relaxed max-w-lg",
                isDark ? "text-slate-400" : "text-slate-600"
              )}
            >
              Precision-engineered noise-cancelling headphones, flagship 5G smartphones, and ergonomic smart wearables crafted for high performance.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a href="#products">
                <Button
                  size="lg"
                  className={cn("px-7 text-xs font-bold uppercase tracking-wider text-white shadow-md", getButtonRadius())}
                  style={{ backgroundColor: primaryColor }}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Shop Tech Drops
                </Button>
              </a>
              <a href="#categories">
                <Button
                  variant="outline"
                  size="lg"
                  className={cn(
                    "px-7 text-xs font-semibold uppercase tracking-wider",
                    getRadiusClass(),
                    isDark ? "border-slate-800 text-slate-300" : "border-slate-300 text-slate-700"
                  )}
                >
                  Explore Categories
                </Button>
              </a>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-800/40 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-blue-500" /> 24h Express
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" /> 2-Yr Warranty
              </div>
              <div className="flex items-center gap-1.5">
                <RotateCcw className="w-4 h-4 text-blue-500" /> 30-Day Return
              </div>
            </div>
          </div>

          <div className="relative z-10 w-full lg:w-[460px] aspect-square rounded-2xl overflow-hidden border border-slate-200/20 shadow-2xl bg-slate-950 flex items-center justify-center">
            <img
              src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800"
              alt="SonicPro Headphone"
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
            />
          </div>
        </div>
      </section>

      {/* 4. CATEGORIES GRID SECTION */}
      <section id="categories" className="py-12 px-6 lg:px-12 max-w-7xl mx-auto w-full space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-3xl font-extrabold font-heading tracking-tight">
              Browse Tech Categories
            </h2>
            <p className={cn("text-xs mt-1", isDark ? "text-slate-400" : "text-slate-500")}>
              High-performance gear built for productivity & mobility
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {store.categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                "p-6 border text-left flex items-center justify-between group transition-all shadow-sm hover:-translate-y-1",
                getRadiusClass(),
                selectedCategory === cat.id
                  ? "border-blue-500 bg-blue-50/10 shadow-md"
                  : isDark
                  ? "bg-slate-900/50 border-slate-800 hover:border-slate-700"
                  : "bg-white border-slate-200 hover:border-blue-400"
              )}
            >
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-500">
                  {(cat as any).productCount || (cat as any).itemCount || 10} Devices Available
                </span>
                <h3 className="text-base font-bold font-heading group-hover:text-blue-600 transition-colors">
                  {cat.name}
                </h3>
              </div>
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white transition-transform group-hover:scale-110"
                style={{ backgroundColor: primaryColor }}
              >
                <ArrowRight className="w-4 h-4" />
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* 5. FEATURED PRODUCTS & FLASH DEALS (9+ Items with Add to Cart & Buy Now) */}
      <section id="products" className="py-12 px-6 lg:px-12 max-w-7xl mx-auto w-full space-y-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b pb-6 border-slate-800/40">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-heading tracking-tight">
              Featured Devices & Flash Deals
            </h2>
            <p className={cn("text-xs mt-1", isDark ? "text-slate-400" : "text-slate-500")}>
              Handpicked flagship electronics with direct instant checkout
            </p>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 scrollbar-none no-scrollbar">
            <button
              onClick={() => setSelectedCategory("all")}
              className={cn(
                "shrink-0 h-8 sm:h-9 px-4 py-1.5 text-xs font-bold font-heading uppercase tracking-wider transition-all whitespace-nowrap active:scale-95 cursor-pointer",
                getRadiusClass(),
                selectedCategory === "all"
                  ? "text-white shadow-md"
                  : isDark
                  ? "bg-slate-900 border border-slate-800 text-slate-400"
                  : "bg-white border border-slate-200 text-slate-700"
              )}
              style={selectedCategory === "all" ? { backgroundColor: primaryColor } : undefined}
            >
              All Tech ({store.products.length})
            </button>
            {store.categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={cn(
                  "shrink-0 h-8 sm:h-9 px-4 py-1.5 text-xs font-bold font-heading uppercase tracking-wider transition-all whitespace-nowrap active:scale-95 cursor-pointer",
                  getRadiusClass(),
                  selectedCategory === c.id
                    ? "text-white shadow-md"
                    : isDark
                    ? "bg-slate-900 border border-slate-800 text-slate-400"
                    : "bg-white border border-slate-200 text-slate-700"
                )}
                style={selectedCategory === c.id ? { backgroundColor: primaryColor } : undefined}
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
                  "group border p-5 flex flex-col justify-between space-y-4 transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1.5",
                  getRadiusClass(),
                  isDark
                    ? "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                    : "bg-white border-slate-200 hover:border-blue-400"
                )}
              >
                <Link
                  href={`/demo/modern/product/${product.slug}`}
                  className="aspect-square w-full rounded-xl overflow-hidden bg-slate-950/20 border border-slate-200/10 relative block"
                >
                  {coverImage ? (
                    <img
                      src={coverImage.url}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500">
                      <Package className="w-10 h-10" />
                    </div>
                  )}

                  {product.featured && (
                    <span className="absolute top-3 left-3 bg-blue-600 text-white text-[10px] font-bold font-mono uppercase tracking-wider px-2.5 py-1 rounded-md shadow-sm">
                      Flash Deal
                    </span>
                  )}
                </Link>

                <div className="space-y-2 text-left flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-500">
                      {product.categoryName}
                    </span>
                    <Link href={`/demo/modern/product/${product.slug}`}>
                      <h3 className="text-base font-bold font-heading hover:text-blue-600 transition-colors line-clamp-1">
                        {product.name}
                      </h3>
                    </Link>
                    <p
                      className={cn(
                        "text-xs font-sans line-clamp-2 leading-relaxed",
                        isDark ? "text-slate-400" : "text-slate-600"
                      )}
                    >
                      {product.shortDescription}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800/20 flex items-baseline justify-between">
                    <span className="text-xl font-extrabold font-heading">
                      {formatCurrency(product.price)}
                    </span>
                    {product.compareAtPrice && (
                      <span className="text-xs text-slate-400 line-through font-mono">
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
                      "w-full text-xs font-bold font-heading uppercase tracking-wider",
                      isDark ? "border-slate-800 text-slate-300" : "border-slate-300 text-slate-700",
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
                    className={cn("w-full text-xs font-bold font-heading uppercase tracking-wider text-white shadow-md", getButtonRadius())}
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

      {/* 6. NEWSLETTER SUBSCRIPTION BLOCK */}
      <section id="newsletter" className="py-16 px-6 lg:px-12 max-w-7xl mx-auto w-full">
        <div
          className={cn(
            "p-8 sm:p-12 border text-center space-y-6 shadow-xl relative overflow-hidden",
            getRadiusClass(),
            isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200"
          )}
        >
          <div className="space-y-2 max-w-xl mx-auto">
            <span className="text-xs font-mono uppercase tracking-widest text-blue-500 font-bold">
              Tech Drop Notifications
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold font-heading tracking-tight">
              Get Instant Flash Sale Alerts
            </h2>
            <p className={cn("text-xs sm:text-sm font-sans", isDark ? "text-slate-400" : "text-slate-600")}>
              Subscribe to receive weekly exclusive discount codes and new product launch drops.
            </p>
          </div>

          <form onSubmit={handleNewsletterSubmit} className="max-w-md mx-auto flex flex-col sm:flex-row gap-3">
            <Input
              type="email"
              placeholder="Enter your email..."
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              required
              className="h-11 text-xs"
              leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
            />
            <Button
              type="submit"
              size="md"
              className={cn("h-11 px-6 text-xs uppercase tracking-wider font-bold text-white shrink-0 shadow-md", getButtonRadius())}
              style={{ backgroundColor: primaryColor }}
            >
              Subscribe
            </Button>
          </form>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 pt-2 font-mono">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> No Spam Ever</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Unsubscribe Anytime</span>
          </div>
        </div>
      </section>

      {/* 7. MODERN FOOTER */}
      <footer className={cn("border-t pt-16 pb-8 px-6 lg:px-12 font-sans text-xs", isDark ? "bg-[#070A10] border-slate-800 text-slate-400" : "bg-white border-slate-200 text-slate-500")}>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 pb-12 border-b border-slate-800/20">
          <div className="space-y-3 md:col-span-2 text-left">
            <h4 className="text-lg font-bold font-heading text-blue-600">{storeTitle}</h4>
            <p className="text-xs leading-relaxed max-w-md">
              Direct-to-consumer tech storefront offering high performance noise cancelling audio gear, 5G smartphones, and wearables with 24-hour express fulfillment.
            </p>
          </div>

          <div className="space-y-3 text-left">
            <h5 className="font-bold font-heading uppercase tracking-wider text-[11px]">Quick Navigation</h5>
            <ul className="space-y-2">
              <li><a href="#hero" className="hover:text-blue-600 transition-colors">Catalog Home</a></li>
              <li><a href="#categories" className="hover:text-blue-600 transition-colors">Categories</a></li>
              <li><a href="#products" className="hover:text-blue-600 transition-colors">Products & Deals</a></li>
              <li><a href="#newsletter" className="hover:text-blue-600 transition-colors">Newsletter</a></li>
            </ul>
          </div>

          <div className="space-y-3 text-left">
            <h5 className="font-bold font-heading uppercase tracking-wider text-[11px]">Customer Support</h5>
            <p>Mon - Fri: 9am - 8pm EST</p>
            <p className="font-mono font-semibold text-blue-600">support@{storeTitle.toLowerCase().replace(/[^a-z]/g, "")}.com</p>
            <p className="font-mono text-slate-400">+1 (800) 555-TECH</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <span>© {new Date().getFullYear()} {storeTitle}. Powered by Catalog SaaS.</span>
          <span className="text-[11px] font-mono text-slate-500">Live Demo E-Commerce Store</span>
        </div>
      </footer>

      {/* Store Search Modal */}
      <StoreSearch
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        products={store.products}
        storeSlug="modern"
      />
    </div>
  );
}
