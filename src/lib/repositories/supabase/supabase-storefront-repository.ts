import { cache } from "react";
import type { StoreData, IStorefrontRepository } from "@/lib/repositories/storefront-repository";
import { Product } from "@/types/product";
import { supabaseProductRepository } from "./supabase-product-repository";
import { supabaseCategoryRepository } from "./supabase-category-repository";
import { supabaseCollectionRepository } from "./supabase-collection-repository";
import { supabaseAppearanceRepository } from "./supabase-appearance-repository";
import { createClient } from "@/lib/supabase/client";
import { normalizePlanTier } from "@/lib/feature-gating";

import { DEMO_STORE_DATA } from "@/lib/demo-data";

export class SupabaseStorefrontRepository implements IStorefrontRepository {
  private getSupabase() {
    if (typeof window === "undefined") {
      try {
        const { createAdminClient } = require("@/lib/supabase/admin");
        return createAdminClient();
      } catch {
        return createClient();
      }
    }
    return createClient();
  }

  private async resolveStorePlan(storeId: string, userId?: string | null, storeRowPlan?: string | null): Promise<string> {
    try {
      const { subscriptionEngine } = await import("@/lib/services/subscription-engine");
      const authSub = await subscriptionEngine.getAuthoritativeSubscription(storeId, userId || null);
      if (authSub?.plan && authSub.plan !== "startup") {
        return authSub.plan;
      }
      if (storeRowPlan) {
        return normalizePlanTier(storeRowPlan);
      }
      return authSub?.plan || "startup";
    } catch {
      return storeRowPlan ? normalizePlanTier(storeRowPlan) : "startup";
    }
  }

  getStoreBySlug = cache(async (slug: string, client?: any): Promise<StoreData | null> => {
    const isDemoSlug = ["demo", "demo-craft-classic", "craft-classic", "aroma-perfumes", "tech-haven", "creative-threads"].includes(slug);

    const supabase = client || this.getSupabase();
    const { data: storeRow, error: storeErr } = await supabase
      .from("stores")
      .select("id, user_id, name, slug, status, plan, logo_url, banner_url, primary_color, secondary_color")
      .eq("slug", slug)
      .maybeSingle();

    if (storeErr || !storeRow) {
      if (isDemoSlug) {
        return {
          ...DEMO_STORE_DATA,
          slug,
          plan: "growth", // Demo stores show all Growth features
        };
      }
      return null;
    }
    const s = storeRow as any;

    if (s.status === "suspended") return null;

    // Load store settings, appearance, categories, collections, products, and plan in parallel
    const [
      settingsRes,
      appearance,
      categories,
      collections,
      productsRes,
      plan,
    ] = await Promise.all([
      supabase
        .from("store_settings")
        .select("metadata")
        .eq("store_id", s.id)
        .maybeSingle(),
      supabaseAppearanceRepository.getSettings(s.id, supabase),
      supabaseCategoryRepository.getAll(s.id, supabase),
      supabaseCollectionRepository.getAll(s.id, supabase),
      supabaseProductRepository.getAll(s.id, undefined, 1, 1000, supabase),
      this.resolveStorePlan(s.id, s.user_id, s.plan),
    ]);

    const metadata = settingsRes?.data?.metadata || {};
    const rawShipping = metadata.shipping;
    const resolvedShipping = {
      freeShippingEnabled: rawShipping?.freeShippingEnabled !== undefined ? Boolean(rawShipping.freeShippingEnabled) : true,
      freeShippingThreshold: typeof rawShipping?.freeShippingThreshold === "number" ? rawShipping.freeShippingThreshold : 0,
      shippingFee: typeof rawShipping?.shippingFee === "number" ? rawShipping.shippingFee : 50,
    };

    return {
      id: s.id,
      name: s.name,
      slug: slug,
      plan,
      appearance,
      categories,
      collections,
      products: productsRes.products || [],
      shipping: resolvedShipping,
    };
  });

  async getProductBySlug(storeSlug: string, productSlug: string, client?: any): Promise<{
    product: Product;
    relatedProducts: Product[];
    store: StoreData;
  } | null> {
    const supabase = client || this.getSupabase();
    const store = await this.getStoreBySlug(storeSlug, supabase);
    if (!store) return null;

    const product = store.products.find((p) => p.slug === productSlug);
    if (!product) return null;
    const relatedProducts = store.products
      .filter((p) => p.id !== product.id && (p.categoryId === product.categoryId || p.featured))
      .slice(0, 4);

    return {
      product,
      relatedProducts,
      store,
    };
  }
}

export const supabaseStorefrontRepository = new SupabaseStorefrontRepository();
