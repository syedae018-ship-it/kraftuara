import React from "react";
import { notFound } from "next/navigation";
import { storefrontRepository } from "@/lib/repositories/storefront-repository";
import BloomTrackOrderPage from "@/components/storefront/templates/bloom/track/BloomTrackOrderPage";
import { Metadata } from "next";
import { headers } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabase/server";

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
    title: `Track Order | ${store.name}`,
    description: `Track real-time fulfillment and delivery status for orders placed at ${store.name}`,
    robots: {
      index: false,
      follow: false,
    },
  };
}

import { hasFeatureAccess } from "@/lib/feature-gating";

export default async function TrackOrderRoute({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ orderId?: string }>;
}) {
  const { slug } = await params;
  const { orderId } = await searchParams;
  const requestHeaders = await headers();
  const isSubdomain = requestHeaders.get("x-is-subdomain") === "true";

  const supabase = await createServerSupabaseClient();
  const store = await storefrontRepository.getStoreBySlug(slug, supabase);
  if (!store) return notFound();

  // Order tracking entitlement enforced via centralized feature gating engine
  const canTrackOrders = hasFeatureAccess(store.plan || "startup", "customer_order_tracking");
  if (!canTrackOrders) return notFound();

  return (
    <BloomTrackOrderPage
      store={store}
      isSubdomain={isSubdomain}
      initialOrderId={orderId || ""}
    />
  );
}

