import React from "react";
import { notFound } from "next/navigation";
import { storefrontRepository } from "@/lib/repositories/storefront-repository";
import { StoreRenderer } from "@/components/storefront/store-renderer";
import BloomStorefront from "@/components/storefront/templates/bloom/home/BloomStorefront";
import { Metadata } from "next";
import { headers } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// Always render dynamically so dashboard changes appear immediately on the storefront.
// Without this, Next.js caches the server component and products/appearance changes go unseen.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createServerSupabaseClient();
  const store = await storefrontRepository.getStoreBySlug(slug, supabase);
  if (!store) return {};

  return {
    title: store.appearance.seo.seoTitle || `${store.name} | Official Catalog`,
    description: store.appearance.seo.seoDescription || store.appearance.branding.description,
    openGraph: {
      title: store.appearance.seo.seoTitle,
      description: store.appearance.seo.seoDescription,
      images: store.appearance.seo.socialImageUrl ? [store.appearance.seo.socialImageUrl] : [],
    },
  };
}

export default async function StoreHomepage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ category?: string; collection?: string }>;
}) {
  const { slug } = await params;
  const { category, collection } = await searchParams;
  const requestHeaders = await headers();
  const isSubdomain = requestHeaders.get("x-is-subdomain") === "true";

  const supabase = await createServerSupabaseClient();
  const store = await storefrontRepository.getStoreBySlug(slug, supabase);
  if (!store) return notFound();

  const themeId = store.appearance.themeId || "bloom";

  if (themeId === "bloom" || themeId === "luxury" || themeId === "modern" || themeId === "creative" || themeId === "luxury-dark") {
    return (
      <BloomStorefront
        store={store}
        isSubdomain={isSubdomain}
        initialCategory={category}
        initialCollection={collection}
      />
    );
  }

  return (
    <StoreRenderer
      store={store}
      initialCategory={category}
      initialCollection={collection}
      isSubdomain={isSubdomain}
    />
  );
}

