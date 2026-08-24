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
    <Card className="group overflow-hidden bg-bloom-card border-bloom-border hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <div className="relative overflow-hidden">
        <Button
          variant="ghost"
          size="icon"
          name="Like Button"
          className={cn(
            "absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-white/80 backdrop-blur-sm hover:bg-white text-bloom-foreground",
            isLiked && "opacity-100 text-red-500"
          )}
          onClick={handleToggleLike}
        >
          <Heart
            name="Like Icon"
            className={cn("h-4 w-4", isLiked && "fill-current")}
          />
        </Button>

        <Link href={productLink} className="block relative">
          <div className="aspect-square overflow-hidden bg-bloom-secondary flex items-center justify-center">
            {resolvedImageUrl && !imageError ? (
              <img
                src={resolvedImageUrl}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full bg-bloom-secondary flex items-center justify-center">
                <div className="text-bloom-muted text-xs">
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
                className="bg-bloom-primary text-bloom-primary-foreground hover:bg-bloom-primary/90"
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

      <CardContent className="p-4 space-y-3 bg-bloom-card">
        <Link href={productLink}>
          <h2 className="font-semibold text-bloom-foreground line-clamp-2 hover:text-bloom-primary transition-colors text-sm font-heading leading-tight">
            {product.name}
          </h2>
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-bloom-foreground">
            {formatCurrency(product.price)}
          </span>
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <span className="text-xs text-bloom-muted line-through">
              {formatCurrency(product.compareAtPrice)}
            </span>
          )}
        </div>

        <Button
          className={cn(
            "w-full transition-all duration-300 text-xs py-2 h-9",
            justAdded
              ? "bg-green-600 text-white hover:bg-green-600"
              : "bg-bloom-primary text-bloom-primary-foreground hover:bg-bloom-primary/90"
          )}
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
