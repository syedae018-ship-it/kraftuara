import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { storefrontRepository } from "@/lib/repositories/storefront-repository";
import { StoreNavbar } from "@/components/storefront/store-navbar";
import { StoreFooter } from "@/components/storefront/store-footer";
import { WhatsAppButton } from "@/components/storefront/whatsapp-button";
import { BuyNowButton } from "@/components/storefront/buy-now-button";
import { StatusBadge } from "@/components/products/status-badge";
import { StoreProductCard } from "@/components/storefront/store-product-card";
import { formatCurrency } from "@/lib/utils";
import { getStoreBasePath, getStoreUrl } from "@/lib/urls";
import { Metadata } from "next";
import { headers } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import BloomProductDetail from "@/components/storefront/templates/bloom/product/BloomProductDetail";
import { Sparkles, ArrowLeft, Package, Check, ShieldCheck, Truck } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; productSlug: string }>;
}): Promise<Metadata> {
  const { slug, productSlug } = await params;
  const supabase = await createServerSupabaseClient();
  const data = await storefrontRepository.getProductBySlug(slug, productSlug, supabase);
  if (!data) return {};

  const { product, store } = data;
  const canonicalUrl = `${getStoreUrl(slug)}/product/${productSlug}`;

  return {
    title: `${product.name} | ${store.name}`,
    description: product.shortDescription || product.seoDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: product.seoTitle || product.name,
      description: product.seoDescription || product.shortDescription,
      url: canonicalUrl,
      images: product.images[0] ? [product.images[0].url] : [],
    },
  };
}

export default async function StoreProductPage({
  params,
}: {
  params: Promise<{ slug: string; productSlug: string }>;
}) {
  const { slug, productSlug } = await params;


  const requestHeaders = await headers();
  const isSubdomain = requestHeaders.get("x-is-subdomain") === "true";
  const storePrefix = getStoreBasePath(slug, isSubdomain);

  const supabase = await createServerSupabaseClient();
  const data = await storefrontRepository.getProductBySlug(slug, productSlug, supabase);
  if (!data) return notFound();

  const { product, relatedProducts, store } = data;
  const coverImage = product.images.find((i) => i.isCover) || product.images[0];

  const themeId = store.appearance.themeId || "bloom";

  if (themeId === "bloom" || themeId === "luxury" || themeId === "modern" || themeId === "creative" || themeId === "luxury-dark") {
    return (
      <BloomProductDetail
        store={store}
        product={product}
        relatedProducts={relatedProducts}
        isSubdomain={isSubdomain}
      />
    );
  }

  // Structured Data JSON-LD
  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: product.name,
    image: product.images.map((i) => i.url),
    description: product.shortDescription,
    sku: product.sku,
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: product.price,
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  return (
    <div className="min-h-screen bg-[#080808] text-white selection:bg-maroon-800 selection:text-white flex flex-col justify-between font-body">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div>
        <StoreNavbar store={store} isSubdomain={isSubdomain} />

        <main className="max-w-7xl mx-auto py-8 sm:py-12 px-4 lg:px-8 space-y-12">
          {/* Back Breadcrumb */}
          <Link
            href={storePrefix || "/"}
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Store Catalog
          </Link>

          {/* Main Product Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Gallery Column */}
            <div className="lg:col-span-6 space-y-4">
              <div className="aspect-square rounded-3xl bg-[#111111] border border-white/10 overflow-hidden flex items-center justify-center shadow-2xl">
                {coverImage ? (
                  <img src={coverImage.url} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <Package className="w-12 h-12 text-zinc-600" />
                )}
              </div>

              {product.images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {product.images.map((img) => (
                    <div
                      key={img.id}
                      className="w-16 h-16 rounded-2xl bg-[#111111] border border-white/10 overflow-hidden shrink-0"
                    >
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info Column */}
            <div className="lg:col-span-6 space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-maroon-400 font-heading">
                    {product.categoryName}
                  </span>
                  <StatusBadge status={product.status} />
                </div>

                <h1 className="text-2xl sm:text-3xl font-bold font-heading text-white tracking-tight leading-snug">
                  {product.name}
                </h1>
                <span className="text-xs font-mono text-zinc-500 block">SKU: {product.sku}</span>

                <div className="pt-3 flex items-baseline gap-3">
                  <span className="text-3xl font-bold font-heading text-white">{formatCurrency(product.price)}</span>
                  {product.compareAtPrice && (
                    <span className="text-base text-zinc-500 line-through">
                      {formatCurrency(product.compareAtPrice)}
                    </span>
                  )}
                </div>
              </div>

              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                {product.longDescription || product.shortDescription}
              </p>

              {/* Product Attributes List */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-2xl bg-[#111111] border border-white/5 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-zinc-500 font-heading">Stock Availability</span>
                  <p className="text-xs font-mono font-semibold text-emerald-400">{product.stock} units available</p>
                </div>
                <div className="p-3 rounded-2xl bg-[#111111] border border-white/5 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-zinc-500 font-heading">Item Weight</span>
                  <p className="text-xs font-mono font-semibold text-white">{product.weight || 0.45} kg</p>
                </div>
              </div>

              {/* Direct WhatsApp Order CTA */}
              <div className="pt-4 space-y-3 border-t border-white/10">
                {["aroma-perfumes", "tech-haven", "creative-threads"].includes(slug) ? (
                  <BuyNowButton
                    productName={product.name}
                    size="lg"
                    className="w-full"
                  />
                ) : (
                  <WhatsAppButton
                    phone={store.appearance.branding.whatsapp || store.appearance.branding.phone}
                    productName={product.name}
                    sku={product.sku}
                    price={product.price}
                    size="lg"
                    className="w-full"
                  />
                )}

                <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono pt-2">
                  <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 100% Authentic Guaranteed</span>
                  <span className="flex items-center gap-1"><Truck className="w-3.5 h-3.5 text-maroon-400" /> Fast Express Shipping</span>
                </div>
              </div>
            </div>
          </div>

          {/* Related Products Grid */}
          {relatedProducts.length > 0 && (
            <div className="pt-12 border-t border-white/10 space-y-6">
              <div>
                <h3 className="text-xl font-bold font-heading text-white tracking-tight">Related Fragrances</h3>
                <p className="text-xs text-zinc-400">You may also like these curated items</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {relatedProducts.map((rp) => (
                  <StoreProductCard
                    key={rp.id}
                    product={rp}
                    storeSlug={slug}
                    whatsappPhone={store.appearance.branding.whatsapp || store.appearance.branding.phone}
                    isSubdomain={isSubdomain}
                  />
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      <StoreFooter store={store} isSubdomain={isSubdomain} />
    </div>
  );
}
