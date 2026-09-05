"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Eye, Sparkles, Package, ShoppingCart, Check } from "lucide-react";
import { Product } from "@/types/product";
import { StatusBadge } from "@/components/products/status-badge";
import { WhatsAppButton } from "./whatsapp-button";
import { formatCurrency } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { getStoreBasePath } from "@/lib/urls";
import { resolveProductImageUrl } from "@/lib/image-resolver";
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
    <div
      style={{
        backgroundColor: "var(--color-surface)",
        borderColor: "var(--color-border)",
      }}
      className={cn(
        "group relative border rounded-2xl overflow-hidden shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-1 flex flex-col justify-between",
        className
      )}
    >
      {/* Cover Image */}
      <div
        style={{ backgroundColor: "var(--color-background-secondary)", borderColor: "var(--color-border)" }}
        className="relative aspect-square w-full border-b overflow-hidden flex items-center justify-center"
      >
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
            <span
              style={{
                backgroundColor: "var(--color-surface)",
                borderColor: "var(--color-accent)",
                color: "var(--color-accent)",
              }}
              className="px-2 py-0.5 rounded-md border text-[10px] font-bold font-heading flex items-center gap-1 shadow-sm"
            >
              <Sparkles className="w-3 h-3" /> Featured
            </span>
          )}
          <StatusBadge status={product.status} className="text-[10px] py-0.5 px-2" />
        </div>

        {/* Quick View Button Hover Overlay */}
        {onQuickView && (
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4 z-10">
            <button
              type="button"
              style={{
                backgroundColor: "var(--color-cta)",
                color: "var(--color-cta-foreground)",
              }}
              onClick={(e) => {
                e.preventDefault();
                onQuickView(product);
              }}
              className="px-4 py-2 rounded-xl font-heading text-xs font-bold flex items-center gap-1.5 transition-all shadow-md hover:opacity-90"
            >
              <Eye className="w-3.5 h-3.5" /> Quick View
            </button>
          </div>
        )}
      </div>

      {/* Card Content Body */}
      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
        <div className="space-y-1">
          <span
            style={{ color: "var(--color-accent)" }}
            className="text-[10px] uppercase font-bold tracking-widest font-heading"
          >
            {product.categoryName}
          </span>
          <Link href={productUrl}>
            <h3
              style={{ color: "var(--color-text-primary)" }}
              className="text-sm font-bold font-heading hover:opacity-80 transition-opacity line-clamp-1"
            >
              {product.name}
            </h3>
          </Link>
          <p
            style={{ color: "var(--color-text-secondary)" }}
            className="text-xs font-body line-clamp-2 leading-relaxed"
          >
            {product.shortDescription}
          </p>
        </div>

        {/* Card Footer: Price & Cart Action */}
        <div
          style={{ borderColor: "var(--color-border)" }}
          className="pt-3 border-t space-y-2"
        >
          <div className="flex items-baseline justify-between">
            <span
              style={{ color: "var(--color-price)" }}
              className="text-base font-bold font-heading"
            >
              {formatCurrency(product.price)}
            </span>
            {product.compareAtPrice && (
              <span
                style={{ color: "var(--color-price-original)" }}
                className="text-xs line-through font-body"
              >
                {formatCurrency(product.compareAtPrice)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isAdding}
              style={{
                backgroundColor: justAdded ? "#16a34a" : "var(--color-add-to-cart)",
                color: justAdded ? "#ffffff" : "var(--color-add-to-cart-foreground)",
              }}
              className="flex-1 h-9 rounded-xl flex items-center justify-center gap-2 text-xs font-bold font-heading transition-all shadow-sm hover:opacity-90"
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
    </div>
  );
}
