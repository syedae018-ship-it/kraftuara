"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ShoppingBag,
  ShieldCheck,
  Truck,
  RotateCcw,
  Minus,
  Plus,
  Package,
  Sparkles,
} from "lucide-react";
import { Product } from "@/types/product";
import { StoreData } from "@/lib/repositories/storefront-repository";
import { ImageZoom } from "@/components/demo/image-zoom";
import { useDemo } from "@/context/demo-context";
import { Button } from "@/components/ui/button";
import { formatCurrency, cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { StoreFooter } from "@/components/storefront/store-footer";

export function DemoProductDetailView({
  product,
  relatedProducts,
  store,
  theme,
}: {
  product: Product;
  relatedProducts: Product[];
  store: StoreData;
  theme: string;
}) {
  const { addToCart, setCartOpen, themeConfig } = useDemo();
  const [selectedImgIdx, setSelectedImgIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"description" | "specs">("description");

  const images = product.images.length > 0 ? product.images : [];
  const currentImage = images[selectedImgIdx] || images[0];

  const primaryColor = themeConfig.primaryColor || "#8B5CF6";
  const isDark = themeConfig.mode === "dark";

  const handleAddToCart = () => {
    addToCart(product, quantity);
    toast.success(
      "Added to Shopping Bag",
      `${quantity}x ${product.name} added to your cart.`
    );
  };

  const handleBuyNow = () => {
    addToCart(product, quantity);
    toast.success(
      "Proceeding to Checkout",
      `Redirecting to direct instant checkout for ${product.name}`
    );
    setCartOpen(true);
  };

  return (
    <div
      className={cn(
        "min-h-screen flex flex-col justify-between font-sans transition-colors duration-300",
        isDark ? "bg-[#080808] text-white" : "bg-[#FAF9F6] text-stone-900"
      )}
    >
      <main className="max-w-7xl mx-auto py-8 sm:py-12 px-4 lg:px-8 space-y-12 w-full">
        {/* Back Link */}
        <Link
          href={`/demo/${theme}`}
          className="inline-flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Store Catalog
        </Link>

        {/* Product Details Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Column: Image Gallery & Zoom */}
          <div className="lg:col-span-6 space-y-4">
            {/* Image Zoom Viewport */}
            <ImageZoom
              src={currentImage?.url || ""}
              alt={product.name}
              aspectRatio="aspect-square"
            />

            {/* Gallery Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {images.map((img, idx) => (
                  <button
                    key={img.id || idx}
                    onClick={() => setSelectedImgIdx(idx)}
                    className={cn(
                      "w-20 h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 bg-[#111]",
                      selectedImgIdx === idx
                        ? "border-purple-500 scale-105 shadow-md"
                        : "border-white/10 opacity-70 hover:opacity-100"
                    )}
                  >
                    <img
                      src={img.url}
                      alt={`${product.name} thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Product Metadata & Order CTA */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <div className="space-y-2">
              <span
                className="text-xs font-mono font-bold uppercase tracking-widest block"
                style={{ color: primaryColor }}
              >
                {product.categoryName}
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold font-heading tracking-tight leading-tight">
                {product.name}
              </h1>
              <span className="text-xs font-mono text-zinc-400 block">
                SKU: {product.sku}
              </span>

              <div className="pt-3 flex items-baseline gap-3">
                <span className="text-3xl font-extrabold font-heading">
                  {formatCurrency(product.price)}
                </span>
                {product.compareAtPrice && (
                  <span className="text-base text-zinc-500 line-through font-mono">
                    {formatCurrency(product.compareAtPrice)}
                  </span>
                )}
              </div>
            </div>

            {/* Short Description */}
            <p className="text-xs sm:text-sm leading-relaxed text-zinc-300 font-sans">
              {product.shortDescription}
            </p>

            {/* Quantity Selector */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 block">
                Select Quantity
              </label>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 border border-white/10 rounded-xl p-1.5 bg-white/5">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-1 rounded-lg hover:bg-white/10 text-zinc-300 hover:text-white"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center text-sm font-mono font-bold">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-1 rounded-lg hover:bg-white/10 text-zinc-300 hover:text-white"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <span className="text-xs font-mono text-emerald-400">
                  In Stock ({product.stock} units)
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10">
              <Button
                variant="outline"
                size="lg"
                onClick={handleAddToCart}
                className="w-full text-xs font-mono font-bold uppercase tracking-wider border-white/20 h-12"
              >
                Add to Cart
              </Button>
              <Button
                size="lg"
                onClick={handleBuyNow}
                className="w-full text-xs font-mono font-bold uppercase tracking-wider text-white shadow-lg h-12"
                style={{ backgroundColor: primaryColor }}
                rightIcon={<ShoppingBag className="w-4 h-4" />}
              >
                Buy Now
              </Button>
            </div>

            {/* Guarantees */}
            <div className="grid grid-cols-3 gap-2 pt-4 border-t border-white/10 text-[11px] font-mono text-zinc-400">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                100% Authentic
              </div>
              <div className="flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-purple-400 shrink-0" />
                Express Shipping
              </div>
              <div className="flex items-center gap-1.5">
                <RotateCcw className="w-4 h-4 text-purple-400 shrink-0" />
                Easy Returns
              </div>
            </div>

            {/* Description & Specifications Tabs */}
            <div className="pt-6 border-t border-white/10 space-y-4">
              <div className="flex items-center gap-4 border-b border-white/10 pb-2">
                <button
                  onClick={() => setActiveTab("description")}
                  className={cn(
                    "text-xs font-mono uppercase tracking-wider font-bold pb-2 transition-colors border-b-2 -mb-2.5",
                    activeTab === "description"
                      ? "border-purple-500 text-white"
                      : "border-transparent text-zinc-400 hover:text-white"
                  )}
                >
                  Product Story
                </button>
                <button
                  onClick={() => setActiveTab("specs")}
                  className={cn(
                    "text-xs font-mono uppercase tracking-wider font-bold pb-2 transition-colors border-b-2 -mb-2.5",
                    activeTab === "specs"
                      ? "border-purple-500 text-white"
                      : "border-transparent text-zinc-400 hover:text-white"
                  )}
                >
                  Specifications
                </button>
              </div>

              {activeTab === "description" ? (
                <p className="text-xs leading-relaxed text-zinc-300 font-sans">
                  {product.longDescription || product.shortDescription}
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                    <span className="text-zinc-500 text-[10px] uppercase block">
                      SKU Code
                    </span>
                    <span className="text-white font-semibold">{product.sku}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                    <span className="text-zinc-500 text-[10px] uppercase block">
                      Category
                    </span>
                    <span className="text-white font-semibold">
                      {product.categoryName}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                    <span className="text-zinc-500 text-[10px] uppercase block">
                      Weight
                    </span>
                    <span className="text-white font-semibold">
                      {product.weight || 0.45} kg
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                    <span className="text-zinc-500 text-[10px] uppercase block">
                      Stock Level
                    </span>
                    <span className="text-emerald-400 font-semibold">
                      {product.stock} units
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Related Products Grid */}
        {relatedProducts.length > 0 && (
          <div className="pt-16 border-t border-white/10 space-y-6 text-left">
            <div>
              <span
                className="text-xs font-mono uppercase tracking-widest font-bold"
                style={{ color: primaryColor }}
              >
                You May Also Like
              </span>
              <h3 className="text-2xl font-bold font-heading text-white tracking-tight">
                Related Recommendations
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((rp) => {
                const rpImg =
                  rp.images.find((i) => i.isCover) || rp.images[0];
                return (
                  <div
                    key={rp.id}
                    className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between space-y-3 group"
                  >
                    <Link
                      href={`/demo/${theme}/product/${rp.slug}`}
                      className="aspect-square rounded-xl overflow-hidden bg-black/40 border border-white/5 block"
                    >
                      {rpImg ? (
                        <img
                          src={rpImg.url}
                          alt={rp.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-600">
                          <Package className="w-8 h-8" />
                        </div>
                      )}
                    </Link>

                    <div className="space-y-1">
                      <Link href={`/demo/${theme}/product/${rp.slug}`}>
                        <h4 className="text-sm font-bold font-heading text-white hover:text-purple-400 transition-colors line-clamp-1">
                          {rp.name}
                        </h4>
                      </Link>
                      <span className="text-xs font-mono text-zinc-400 block">
                        {formatCurrency(rp.price)}
                      </span>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        addToCart(rp, 1);
                        toast.success("Added to Bag", `${rp.name} added.`);
                      }}
                      className="w-full text-xs font-mono uppercase tracking-wider border-white/10"
                    >
                      Add to Bag
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      <StoreFooter store={store} />
    </div>
  );
}
