import React from "react";
import { notFound } from "next/navigation";
import { storefrontRepository } from "@/lib/repositories/storefront-repository";
import { LuxuryStore } from "@/components/demo/themes/luxury-store";
import { ModernStore } from "@/components/demo/themes/modern-store";
import { CreativeStore } from "@/components/demo/themes/creative-store";
import { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ theme: string }>;
}): Promise<Metadata> {
  const { theme } = await params;

  const storeSlugMap: Record<string, string> = {
    luxury: "aroma-perfumes",
    modern: "tech-haven",
    creative: "creative-threads",
  };

  const storeSlug = storeSlugMap[theme];
  if (!storeSlug) return {};

  const supabase = await createServerSupabaseClient();
  const store = await storefrontRepository.getStoreBySlug(storeSlug, supabase);
  if (!store) return {};

  return {
    title: `Live Demo - ${store.name} Storefront`,
    description: `Interactive live demo of the ${store.name} theme.`,
  };
}

export default async function DemoThemePage({
  params,
}: {
  params: Promise<{ theme: string }>;
}) {
  const { theme } = await params;

  const storeSlugMap: Record<string, string> = {
    luxury: "aroma-perfumes",
    modern: "tech-haven",
    creative: "creative-threads",
  };

  const storeSlug = storeSlugMap[theme] || "aroma-perfumes";
  const supabase = await createServerSupabaseClient();
  const store = await storefrontRepository.getStoreBySlug(storeSlug, supabase);
  if (!store) return notFound();

  if (theme === "modern") {
    return <ModernStore store={store} />;
  }

  if (theme === "creative") {
    return <CreativeStore store={store} />;
  }

  // Default to Luxury Store theme
  return <LuxuryStore store={store} />;
}
