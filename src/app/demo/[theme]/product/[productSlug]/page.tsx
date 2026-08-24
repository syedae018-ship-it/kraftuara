import React from "react";
import { notFound } from "next/navigation";
import { storefrontRepository } from "@/lib/repositories/storefront-repository";
import { DemoProductDetailView } from "@/components/demo/demo-product-detail-view";
import { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ theme: string; productSlug: string }>;
}): Promise<Metadata> {
  const { theme, productSlug } = await params;

  const storeSlugMap: Record<string, string> = {
    luxury: "aroma-perfumes",
    modern: "tech-haven",
    creative: "creative-threads",
  };

  const storeSlug = storeSlugMap[theme] || "aroma-perfumes";
  const supabase = await createServerSupabaseClient();
  const data = await storefrontRepository.getProductBySlug(storeSlug, productSlug, supabase);
  if (!data) return {};

  const { product, store } = data;

  return {
    title: `${product.name} | Live Demo ${store.name}`,
    description: product.shortDescription || product.seoDescription,
  };
}

export default async function DemoStoreProductPage({
  params,
}: {
  params: Promise<{ theme: string; productSlug: string }>;
}) {
  const { theme, productSlug } = await params;

  const storeSlugMap: Record<string, string> = {
    luxury: "aroma-perfumes",
    modern: "tech-haven",
    creative: "creative-threads",
  };

  const storeSlug = storeSlugMap[theme] || "aroma-perfumes";
  const supabase = await createServerSupabaseClient();
  const data = await storefrontRepository.getProductBySlug(storeSlug, productSlug, supabase);
  if (!data) return notFound();

  const { product, relatedProducts, store } = data;

  return (
    <DemoProductDetailView
      product={product}
      relatedProducts={relatedProducts}
      store={store}
      theme={theme}
    />
  );
}
