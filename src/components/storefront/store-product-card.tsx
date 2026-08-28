"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, MessageSquare, Sparkles, Package, ShoppingCart, Check } from "lucide-react";
import { Product } from "@/types/product";
import { StatusBadge } from "@/components/products/status-badge";
import { WhatsAppButton } from "./whatsapp-button";
import { formatCurrency } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { getStoreBasePath } from "@/lib/urls";
import { resolveImageUrl, resolveProductImageUrl, FALLBACK_PRODUCT_IMAGE } from "@/lib/image-resolver";
import ProductImage from "./product-image";
import { useCart } from "@/context/CartContext";

export interface StoreProductCardProps {
  product: Product;
  storeSlug: string;
  whatsappPhone?: string;
  onQuickView?: (product: Product) => void;
  className?: string;
  isSubdomain?: boolean;
}

export function StoreProductCard({
  product,
  storeSlug,
  whatsappPhone,
  onQuickView,
  className,
  isSubdomain = false,
}: StoreProductCardProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const { addToCart } = useCart();
  const pathname = usePathname();
  const isDemo = pathname?.startsWith("/demo");
  const demoTheme = pathname?.split("/")[2] || "luxury";
  const storePrefix = getStoreBasePath(storeSlug, isSubdomain, isDemo, demoTheme);
  const productUrl = `${storePrefix}/product/${product.slug}`;

  const coverImage = product.images.find((img) => img.isCover) || product.images[0];
  const resolvedImageUrl = resolveProductImageUrl(coverImage?.url || "");

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsAdding(true);
    await new Promise((resolve) => setTimeout(resolve, 250));

    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: resolvedImageUrl,
      quantity: 1,
      sku: product.sku,
    });

    setIsAdding(false);
    setJustAdded(true);
    toast.success("Added to Cart", `${product.name} added to your cart.`);
    setTimeout(() => setJustAdded(false), 2000);
  };

  return (
    <motion.div
      whileHover={{ y: -3 }}
      className={cn(
        "group relative bg-[#151515] border border-white/10 rounded-2xl overflow-hidden shadow-card transition-all duration-200 hover:border-white/20 flex flex-col justify-between",
        className
      )}
    >
      {/* Cover Image */}
      <div className="relative aspect-square w-full bg-[#111111] border-b border-white/5 overflow-hidden flex items-center justify-center">
        {coverImage ? (
          <ProductImage
            src={coverImage.url}
            alt={coverImage.altText || product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <Package className="w-10 h-10 text-zinc-600" />
        )}

        {/* Status / Featured Badge */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5">
          {product.featured && (
            <span className="px-2 py-0.5 rounded-md bg-maroon-900/90 border border-maroon-600/50 text-[10px] font-bold font-heading text-maroon-300 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-maroon-400" /> Featured
            </span>
          )}
          <StatusBadge status={product.status} className="text-[10px] py-0.5 px-2" />
        </div>

        {/* Quick View Button Hover Overlay */}
        {onQuickView && (
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4 z-10">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onQuickView(product);
              }}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-heading text-xs font-bold border border-white/20 backdrop-blur-md flex items-center gap-1.5 transition-all shadow-glow"
            >
              <Eye className="w-3.5 h-3.5" /> Quick View
            </button>
          </div>
        )}
      </div>

      {/* Card Content Body */}
      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-widest text-maroon-400 font-heading">
            {product.categoryName}
          </span>
          <Link href={`${storePrefix}/product/${product.slug}`}>
            <h3 className="text-sm font-bold font-heading text-white hover:text-maroon-300 transition-colors line-clamp-1">
              {product.name}
            </h3>
          </Link>
          <p className="text-xs text-zinc-400 font-body line-clamp-2 leading-relaxed">
            {product.shortDescription}
          </p>
        </div>

        {/* Card Footer: Price & Cart Action */}
        <div className="pt-3 border-t border-white/5 space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-base font-bold font-heading text-white">{formatCurrency(product.price)}</span>
            {product.compareAtPrice && (
              <span className="text-xs text-zinc-500 line-through font-body">
                {formatCurrency(product.compareAtPrice)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isAdding}
              className={cn(
                "flex-1 h-9 rounded-xl flex items-center justify-center gap-2 text-xs font-bold font-heading transition-all shadow-glow",
                justAdded
                  ? "bg-emerald-600 text-white"
                  : "bg-maroon-800 hover:bg-maroon-700 text-white"
              )}
            >
              {justAdded ? (
                <>
                  <Check className="w-3.5 h-3.5" /> Added!
                </>
              ) : (
                <>
                  <ShoppingCart className="w-3.5 h-3.5" /> Add to Cart
                </>
              )}
            </button>

            {whatsappPhone && (
              <WhatsAppButton
                phone={whatsappPhone}
                productName={product.name}
                sku={product.sku}
                price={product.price}
                size="sm"
                className="shrink-0"
              />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
