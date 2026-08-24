import React from "react";
import { storefrontRepository } from "@/lib/repositories/storefront-repository";
import { StorefrontShell } from "@/components/storefront/storefront-shell";

export default async function StoreLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { createServerSupabaseClient } = await import("@/lib/supabase/server");
  const supabase = await createServerSupabaseClient();
  const store = await storefrontRepository.getStoreBySlug(slug, supabase);

  return (
    <StorefrontShell storeSlug={slug} storeId={store?.id ?? null}>
      {children}
    </StorefrontShell>
  );
}
