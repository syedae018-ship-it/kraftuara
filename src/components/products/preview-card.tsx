"use client";

import React, { useState } from "react";
import { Monitor, Smartphone, MessageSquare, Sparkles, Package, Check } from "lucide-react";
import { Product, ProductImage } from "@/types/product";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "./status-badge";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

export interface PreviewCardProps {
  product: Partial<Product>;
  images: ProductImage[];
  className?: string;
}

export function PreviewCard({ product, images, className }: PreviewCardProps) {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [selectedImgIndex, setSelectedImgIndex] = useState(0);

  const activeImage = images[selectedImgIndex] || images[0];

  return (
    <Card className={cn("p-6 space-y-4 bg-[#151515] border-white/10 sticky top-20", className)}>
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div>
          <h3 className="text-sm font-bold font-heading text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-maroon-400" /> Live Storefront Preview
          </h3>
          <p className="text-[11px] text-zinc-400 font-body">Customer perspective on catalog store</p>
        </div>

        {/* Device Switcher */}
        <div className="flex items-center bg-[#111111] border border-white/10 rounded-xl p-1 shrink-0">
          <button
            type="button"
            onClick={() => setDevice("desktop")}
            className={cn(
              "p-1.5 rounded-lg text-xs transition-colors flex items-center gap-1 font-heading font-medium",
              device === "desktop" ? "bg-maroon-800 text-white" : "text-zinc-400 hover:text-white"
            )}
            title="Desktop View"
          >
            <Monitor className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Desktop</span>
          </button>
          <button
            type="button"
            onClick={() => setDevice("mobile")}
            className={cn(
              "p-1.5 rounded-lg text-xs transition-colors flex items-center gap-1 font-heading font-medium",
              device === "mobile" ? "bg-maroon-800 text-white" : "text-zinc-400 hover:text-white"
            )}
            title="Mobile View"
          >
            <Smartphone className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Mobile</span>
          </button>
        </div>
      </div>

      {/* Frame Container */}
      <div
        className={cn(
          "mx-auto transition-all duration-300 bg-[#080808] border border-white/10 rounded-2xl overflow-hidden shadow-2xl p-4 space-y-4",
          device === "mobile" ? "max-w-[320px]" : "w-full"
        )}
      >
        {/* Store Header Mock */}
        <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs">
          <span className="font-bold font-heading text-white tracking-tight">AROMA PERFUMES</span>
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Catalog</span>
        </div>

        {/* Main Cover Image */}
        <div className="relative aspect-square w-full bg-[#111111] border border-white/5 rounded-xl overflow-hidden flex items-center justify-center">
          {activeImage ? (
            <img src={activeImage.url} alt={product.name || "Product"} className="w-full h-full object-cover" />
          ) : (
            <Package className="w-10 h-10 text-zinc-600" />
          )}

          {product.status && (
            <div className="absolute top-2.5 right-2.5">
              <StatusBadge status={product.status} />
            </div>
          )}
        </div>

        {/* Thumbnail Selector */}
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {images.map((img, idx) => (
              <button
                key={img.id}
                type="button"
                onClick={() => setSelectedImgIndex(idx)}
                className={cn(
                  "w-10 h-10 rounded-lg bg-[#111111] border overflow-hidden shrink-0 transition-all",
                  selectedImgIndex === idx ? "border-maroon-500 shadow-glow" : "border-white/10 opacity-70"
                )}
              >
                <img src={img.url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Product Details */}
        <div className="space-y-2 text-left">
          <span className="text-[10px] uppercase font-bold tracking-widest text-maroon-400 font-heading">
            {product.categoryName || "Perfumes"}
          </span>
          <h4 className="text-base font-bold font-heading text-white leading-snug">
            {product.name || "Untitled Catalog Product"}
          </h4>
          <p className="text-xs text-zinc-400 font-body line-clamp-2 leading-relaxed">
            {product.shortDescription || "No short description provided yet."}
          </p>

          <div className="pt-2 flex items-baseline gap-2">
            <span className="text-lg font-bold font-heading text-white">
              {formatCurrency(product.price || 0)}
            </span>
            {product.compareAtPrice && product.compareAtPrice > 0 && (
              <span className="text-xs text-zinc-500 line-through font-body">
                {formatCurrency(product.compareAtPrice)}
              </span>
            )}
          </div>
        </div>

        {/* WhatsApp Order CTA Button */}
        <button
          type="button"
          className="w-full h-10 rounded-xl bg-[#800020] text-white text-xs font-bold font-heading flex items-center justify-center gap-2 shadow-glow hover:bg-[#9b1b30] transition-colors"
        >
          <MessageSquare className="w-4 h-4" /> Order via WhatsApp
        </button>
      </div>
    </Card>
  );
}
