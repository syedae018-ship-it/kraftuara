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
import { resolveProductImageUrl, FALLBACK_PRODUCT_IMAGE } from "@/lib/image-resolver";
import ProductImage from "@/components/storefront/product-image";
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
  const rawImageUrl = coverImage?.url || "";
  const imageUrl = resolveProductImageUrl(rawImageUrl);
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
      style={getBloomThemeStyles(store.appearance)}
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
                {rawImageUrl ? (
                  <ProductImage
                    src={rawImageUrl}
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
              <span style={{ color: "var(--color-accent)" }} className="text-xs uppercase font-bold tracking-wider font-mono">
                {product.categoryName || "Catalog"}
              </span>
              <h1 style={{ color: "var(--color-text-primary)" }} className="text-3xl lg:text-4xl font-bold tracking-tight font-heading">
                {product.name}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <span style={{ color: "var(--color-price)" }} className="text-3xl font-bold font-mono">
                {formatCurrency(product.price)}
              </span>
              {product.compareAtPrice && product.compareAtPrice > product.price && (
                <span style={{ color: "var(--color-price-original)" }} className="text-lg line-through font-mono">
                  {formatCurrency(product.compareAtPrice)}
                </span>
              )}
            </div>

            <p style={{ color: "var(--color-text-secondary)" }} className="leading-relaxed text-sm">
              {product.longDescription || product.shortDescription}
            </p>

            <Separator style={{ backgroundColor: "var(--color-border)" }} />

            <div className="space-y-4">
              <div>
                <label style={{ color: "var(--color-text-primary)" }} className="text-xs font-semibold uppercase tracking-wider mb-2 block font-heading">
                  Quantity
                </label>
                <div className="flex items-center gap-3">
                  <div style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }} className="flex items-center border rounded-lg">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleQuantityChange("decrement")}
                      disabled={quantity <= 1}
                      style={{ color: "var(--color-text-primary)" }}
                      className="h-10 w-10 rounded-r-none border-0"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span style={{ color: "var(--color-text-primary)" }} className="px-4 py-2 min-w-[60px] text-center font-semibold text-sm font-mono">
                      {quantity}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleQuantityChange("increment")}
                      style={{ color: "var(--color-text-primary)" }}
                      className="h-10 w-10 rounded-l-none border-0"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <Button
                  size="lg"
                  style={{
                    backgroundColor: justAdded ? "#16a34a" : "var(--color-add-to-cart)",
                    color: justAdded ? "#ffffff" : "var(--color-add-to-cart-foreground)",
                  }}
                  className="flex-1 transition-all duration-300 text-sm font-semibold h-11 hover:opacity-90"
                  onClick={handleAddToCart}
                  disabled={isAdding}
                >
                  {isAdding ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Adding...
                    </div>
                  ) : justAdded ? (
                    <div className="flex items-center justify-center gap-2">
                      <Check className="h-4 w-4" />
                      Added!
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <ShoppingCart className="h-4 w-4" />
                      Add to Cart
                    </div>
                  )}
                </Button>

                <Button
                  size="lg"
                  style={{
                    backgroundColor: "var(--color-buy-now)",
                    color: "var(--color-buy-now-foreground)",
                  }}
                  className="flex-1 transition-all duration-300 text-sm font-semibold h-11 hover:opacity-90"
                  onClick={handleBuyNow}
                >
                  Buy Now
                </Button>
              </div>


              <div className="flex items-center gap-4 pt-2">
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

        <Features shipping={store.shipping} />

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
