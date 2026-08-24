"use client";

import React, { useState } from "react";
import { getBloomThemeStyles, getBloomFontsLink } from "../home/BloomStorefront";
import { useRouter } from "next/navigation";
import Header from "../layout/Header";
import Footer from "../layout/Footer";
import Features from "./Features";
import ProductBreadcrumb from "./ProductBreadcrumb";
import RelatedProducts from "./RelatedProducts";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { useCart } from "@/context/CartContext";
import { cn } from "@/lib/utils";
import {
  Check,
  Heart,
  Minus,
  Plus,
  Share2,
  ShoppingCart,
  Star,
} from "lucide-react";
import { StoreData } from "@/types/store";
import { Product } from "@/types/product";
import { getStoreBasePath } from "@/lib/urls";
import { formatCurrency } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { trackClientEvent } from "@/components/storefront/storefront-tracker";
import { useEffect } from "react";

export default function BloomProductDetail({
  store,
  product,
  relatedProducts,
  isSubdomain = false,
}: {
  store: StoreData;
  product: Product;
  relatedProducts: Product[];
  isSubdomain?: boolean;
}) {
  const { addToCart } = useCart();
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  const coverImage = product.images.find((img) => img.isCover) || product.images[0];
  const imageUrl = coverImage?.url || "";
  const basePath = getStoreBasePath(store.slug, isSubdomain);

  useEffect(() => {
    if (store?.id && product?.id) {
      trackClientEvent(store.id, "page_view", product.id);
      trackClientEvent(store.id, "product_view", product.id);
    }
  }, [store?.id, product?.id]);

  const handleAddToCart = async () => {
    setIsAdding(true);
    await new Promise((resolve) => setTimeout(resolve, 350));

    // Add specified quantity to cart
    for (let i = 0; i < quantity; i++) {
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        image: imageUrl,
        quantity: 1,
        sku: product.sku,
      });
    }

    if (store?.id && product?.id) {
      trackClientEvent(store.id, "add_to_cart", product.id);
    }

    setIsAdding(false);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    setTimeout(() => {
      router.push(`${basePath}/cart`);
    }, 500);
  };

  const handleQuantityChange = (type: "increment" | "decrement") => {
    if (type === "increment") {
      setQuantity((prev) => prev + 1);
    } else if (type === "decrement" && quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Copied to Clipboard", "Product link copied successfully.");
    }
  };

  const fontsLink = getBloomFontsLink(store.appearance.typography);

  return (
    <div
      className="bloom-theme min-h-screen flex flex-col justify-between antialiased bg-bloom-background text-bloom-foreground"
      style={getBloomThemeStyles(store.appearance.colors, store.appearance.typography)}
    >
      {fontsLink && (
        <link rel="stylesheet" href={fontsLink} />
      )}
      <Header store={store} isSubdomain={isSubdomain} />

      <main className="flex-grow bg-bloom-background container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProductBreadcrumb storeSlug={store.slug} isSubdomain={isSubdomain} />

        <div className="grid lg:grid-cols-2 gap-12 mb-16 items-start">
          {/* Gallery View */}
          <div className="space-y-4">
            <div className="w-full max-w-[500px] mx-auto flex flex-col items-center">
              <div className="rounded-xl overflow-hidden mb-4 w-full aspect-square bg-bloom-secondary border border-bloom-border flex items-center justify-center">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={product.name}
                    className="object-cover w-full h-full max-h-[500px]"
                  />
                ) : (
                  <div className="text-bloom-muted text-sm">Image not available</div>
                )}
              </div>
            </div>
          </div>

          {/* Details View */}
          <div className="space-y-6">
            <div className="space-y-2">
              <span className="text-xs uppercase font-bold tracking-wider text-bloom-primary font-mono">
                {product.categoryName || "Catalog"}
              </span>
              <h1 className="text-3xl lg:text-4xl font-bold text-bloom-foreground tracking-tight font-heading">
                {product.name}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-bloom-primary text-bloom-primary" />
                ))}
              </div>
              <span className="text-xs text-bloom-muted font-mono">
                (4.8) • 127 reviews
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-bloom-foreground font-mono">
                {formatCurrency(product.price)}
              </span>
              {product.compareAtPrice && product.compareAtPrice > product.price && (
                <span className="text-lg text-bloom-muted line-through font-mono">
                  {formatCurrency(product.compareAtPrice)}
                </span>
              )}
            </div>

            <p className="text-bloom-muted leading-relaxed text-sm">
              {product.longDescription || product.shortDescription}
            </p>

            <Separator className="bg-bloom-border" />

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-bloom-foreground uppercase tracking-wider mb-2 block">
                  Quantity
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-bloom-border rounded-lg bg-bloom-background">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleQuantityChange("decrement")}
                      disabled={quantity <= 1}
                      className="h-10 w-10 rounded-r-none border-0"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="px-4 py-2 min-w-[60px] text-center font-semibold text-sm text-bloom-foreground font-mono">
                      {quantity}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleQuantityChange("increment")}
                      className="h-10 w-10 rounded-l-none border-0"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <Button
                  size="lg"
                  className={cn(
                    "flex-1 transition-all duration-300 text-sm font-semibold h-11",
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
                      Added!
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4" />
                      Add to Cart
                    </div>
                  )}
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleBuyNow}
                  className="flex-1 border-bloom-border bg-bloom-background text-bloom-foreground hover:bg-bloom-secondary hover:text-bloom-primary h-11"
                >
                  Buy Now
                </Button>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsLiked(!isLiked)}
                  className={cn(
                    "text-bloom-muted hover:text-bloom-foreground border-0",
                    isLiked && "text-red-500 hover:text-red-500"
                  )}
                >
                  <Heart
                    className={cn("h-4 w-4 mr-2", isLiked && "fill-current")}
                  />
                  Add to Wishlist
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShare}
                  className="text-bloom-muted hover:text-bloom-foreground border-0"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          </div>
        </div>

        <Features />

        <RelatedProducts
          relatedProducts={relatedProducts}
          storeSlug={store.slug}
          storeId={store.id}
          isSubdomain={isSubdomain}
        />
      </main>

      <Footer store={store} isSubdomain={isSubdomain} />
    </div>
  );
}
