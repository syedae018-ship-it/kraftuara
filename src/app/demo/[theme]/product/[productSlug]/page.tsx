import React from "react";
import { notFound } from "next/navigation";
import { storefrontRepository } from "@/lib/repositories/storefront-repository";
import BloomProductDetail from "@/components/storefront/templates/bloom/product/BloomProductDetail";
import { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ theme: string; productSlug: string }>;
}): Promise<Metadata> {
  const { productSlug } = await params;
  const supabase = await createServerSupabaseClient();
  const data = await storefrontRepository.getProductBySlug("demo", productSlug, supabase);
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
  const { productSlug } = await params;

  const supabase = await createServerSupabaseClient();
  const data = await storefrontRepository.getProductBySlug("demo", productSlug, supabase);
  if (!data) return notFound();

  const { product, relatedProducts, store } = data;

  return (
    <BloomProductDetail
      product={product}
      relatedProducts={relatedProducts}
      store={store}
      isSubdomain={false}
    />
  );
}
