import React from "react";
import { notFound } from "next/navigation";
import { storefrontRepository } from "@/lib/repositories/storefront-repository";
import BloomCartPage from "@/components/storefront/templates/bloom/cart/BloomCartPage";
import { Metadata } from "next";
import { headers } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabase/server";

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
    title: `Shopping Cart | ${store.name}`,
    description: `View items in your cart for ${store.name}`,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function CartPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const requestHeaders = await headers();
  const isSubdomain = requestHeaders.get("x-is-subdomain") === "true";

  const supabase = await createServerSupabaseClient();
  const store = await storefrontRepository.getStoreBySlug(slug, supabase);
  if (!store) return notFound();

  return (
    <BloomCartPage
      store={store}
      isSubdomain={isSubdomain}
    />
  );
}
