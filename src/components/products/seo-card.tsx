"use client";

import React, { useEffect } from "react";
import { Search, Globe, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface SEOCardProps {
  productName: string;
  slug: string;
  seoTitle: string;
  seoDescription: string;
  onSlugChange: (val: string) => void;
  onSeoTitleChange: (val: string) => void;
  onSeoDescriptionChange: (val: string) => void;
  className?: string;
}

export function SEOCard({
  productName,
  slug,
  seoTitle,
  seoDescription,
  onSlugChange,
  onSeoTitleChange,
  onSeoDescriptionChange,
  className,
}: SEOCardProps) {
  // Auto-generate slug if blank when product name updates
  useEffect(() => {
    if (productName && !slug) {
      const generated = productName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
      onSlugChange(generated);
    }
  }, [productName, slug, onSlugChange]);

  const displayTitle = seoTitle || (productName ? `${productName} | Aroma Perfumes` : "Product Title | Catalog Store");
  const displayDesc = seoDescription || "Discover our premium handcrafted product. Free shipping on orders over $100.";
  const displayUrl = `https://aroma-perfumes.catalog.io/products/${slug || "product-slug"}`;

  return (
    <Card className={cn("p-6 space-y-6 bg-[#151515] border-white/10", className)}>
      <div>
        <h3 className="text-base font-bold font-heading text-white tracking-tight">
          Search Engine Optimization (SEO)
        </h3>
        <p className="text-xs text-zinc-400 font-body mt-0.5">
          Optimize how your product appears in Google search results and social links.
        </p>
      </div>

      {/* Google SERP Search Snippet Preview */}
      <div className="bg-[#111111] border border-white/10 rounded-xl p-4 space-y-1 font-body">
        <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono truncate">
          <Globe className="w-3 h-3 text-emerald-400 shrink-0" />
          {displayUrl}
        </div>
        <h4 className="text-sm font-semibold text-blue-400 hover:underline cursor-pointer font-heading tracking-wide line-clamp-1">
          {displayTitle}
        </h4>
        <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">
          {displayDesc}
        </p>
      </div>

      <div className="space-y-4">
        <Input
          label="URL & Handle Slug"
          placeholder="royal-amber-oud-100ml"
          value={slug}
          onChange={(e) => onSlugChange(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
          leftIcon={<Globe className="w-4 h-4 text-zinc-500" />}
          helperText="Unique URL path for this catalog item."
        />

        <Input
          label="SEO Meta Title"
          placeholder="e.g. Royal Amber Oud 100ml | Aroma Perfumes"
          value={seoTitle}
          onChange={(e) => onSeoTitleChange(e.target.value)}
        />

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-300 font-heading tracking-wide">
            SEO Meta Description
          </label>
          <textarea
            rows={3}
            placeholder="Write a concise meta description summarizing key ingredients and notes..."
            value={seoDescription}
            onChange={(e) => onSeoDescriptionChange(e.target.value)}
            className="w-full bg-[#111111] border border-white/10 rounded-xl p-3 text-xs text-white font-body placeholder:text-zinc-600 outline-none hover:border-white/20 focus:border-maroon-700 focus:ring-2 focus:ring-maroon-700/20 transition-all resize-none"
          />
          <div className="flex justify-between text-[11px] text-zinc-500">
            <span>Recommended: 120-160 characters</span>
            <span>{seoDescription.length}/160</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
