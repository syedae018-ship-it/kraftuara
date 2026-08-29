"use client";

import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { useCart } from "@/context/CartContext";
import { cn } from "@/lib/utils";
import { Check, Eye, Heart, ShoppingCart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Product } from "@/types/product";
import { getStoreBasePath } from "@/lib/urls";
import { formatCurrency } from "@/lib/utils";
import { resolveProductImageUrl } from "@/lib/image-resolver";
import ProductImage from "@/components/storefront/product-image";
import { trackClientEvent } from "@/components/storefront/storefront-tracker";

export default function ProductCard({
  product,
  storeSlug,
  storeId,
  isSubdomain = false,
  onQuickView,
}: {
  product: Product;
  storeSlug: string;
  storeId?: string;
  isSubdomain?: boolean;
  onQuickView?: (product: Product) => void;
}) {
  const [isLiked, setIsLiked] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const { addToCart } = useCart();
  const coverImage = product.images.find((img) => img.isCover) || product.images[0];
  const imageUrl = coverImage?.url || "";

  const resolvedImageUrl = resolveProductImageUrl(imageUrl);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsAdding(true);
    await new Promise((resolve) => setTimeout(resolve, 350));

    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: resolvedImageUrl,
      quantity: 1,
      sku: product.sku,
    });

    if (storeId) {
      trackClientEvent(storeId, "add_to_cart", product.id);
    }

    setIsAdding(false);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  const handleToggleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLiked(!isLiked);
  };

  const basePath = getStoreBasePath(storeSlug, isSubdomain);
  const productLink = `${basePath}/product/${product.slug}`;

  return (
    <Card
      style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
      className="group overflow-hidden border hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
    >
      <div className="relative overflow-hidden">
        <Link href={productLink} className="block relative">
          <div
            style={{ backgroundColor: "var(--color-background-secondary)" }}
            className="aspect-square overflow-hidden flex items-center justify-center"
          >
            {imageUrl ? (
              <ProductImage
                src={imageUrl}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div style={{ color: "var(--color-text-muted)" }} className="text-xs">
                  Image not available
                </div>
              </div>
            )}
          </div>

          {onQuickView && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
              <Button
                size="sm"
                type="button"
                style={{ backgroundColor: "var(--color-cta)", color: "var(--color-cta-foreground)" }}
                className="hover:opacity-90"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onQuickView(product);
                }}
              >
                <Eye className="h-4 w-4 mr-2" />
                Quick View
              </Button>
            </div>
          )}
        </Link>
      </div>

      <CardContent style={{ backgroundColor: "var(--color-surface)" }} className="p-4 space-y-3">
        <Link href={productLink}>
          <h2
            style={{ color: "var(--color-text-primary)" }}
            className="font-semibold line-clamp-2 hover:opacity-80 transition-opacity text-sm font-heading leading-tight"
          >
            {product.name}
          </h2>
        </Link>

        <div className="flex items-center gap-2">
          <span style={{ color: "var(--color-price)" }} className="text-base font-bold font-mono">
            {formatCurrency(product.price)}
          </span>
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <span style={{ color: "var(--color-price-original)" }} className="text-xs line-through font-mono">
              {formatCurrency(product.compareAtPrice)}
            </span>
          )}
        </div>

        <Button
          style={{
            backgroundColor: justAdded ? "#16a34a" : "var(--color-add-to-cart)",
            color: justAdded ? "#ffffff" : "var(--color-add-to-cart-foreground)",
          }}
          className="w-full transition-all duration-300 text-xs py-2 h-9 hover:opacity-90 font-medium"
          onClick={handleAddToCart}
          disabled={isAdding}
        >
          {isAdding ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Adding...
            </div>
          ) : justAdded ? (
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4" />
              Added to Cart!
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Add to Cart
            </div>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

