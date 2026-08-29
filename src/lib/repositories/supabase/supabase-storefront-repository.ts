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
    return createClient();
  }

  /**
   * Resolves the store's active plan tier from the subscriptions table.
   * Returns "startup" when no subscription exists or the sub is expired/cancelled.
   */
  private async resolveStorePlan(storeId: string, supabase: any): Promise<string> {
    try {
      const { data: subRow } = await (supabase.from("subscriptions") as any)
        .select("plan, status, current_period_end")
        .eq("store_id", storeId)
        .maybeSingle();

      if (!subRow) {
        // Fallback check if subscription table is linking or if store had successful payment
        try {
          const { data: latestPayment } = await (supabase.from("payments") as any)
            .select("plan")
            .eq("store_id", storeId)
            .eq("status", "successful")
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (latestPayment?.plan) {
            return normalizePlanTier(latestPayment.plan);
          }
        } catch {
          // Ignore fallback query error
        }
        return "startup";
      }

      const plan = normalizePlanTier(subRow.plan);
      let status = subRow.status || "active";

      if (subRow.current_period_end && new Date(subRow.current_period_end).getTime() < Date.now()) {
        status = "expired";
      }

      if (status === "expired" || status === "cancelled" || status === "pending") {
        return "startup";
      }

      return plan;
    } catch {
      return "startup";
    }
  }


  async getStoreBySlug(slug: string, client?: any): Promise<StoreData | null> {
    const isDemoSlug = ["demo", "demo-craft-classic", "craft-classic", "aroma-perfumes", "tech-haven", "creative-threads"].includes(slug);

    const supabase = client || this.getSupabase();
    const { data: storeRow, error: storeErr } = await supabase.from("stores").select("*").eq("slug", slug).maybeSingle();

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

    // Load store_settings for draft/publish snapshot
    const { data: settingsRow } = await supabase
      .from("store_settings")
      .select("metadata")
      .eq("store_id", s.id)
      .maybeSingle();

    const metadata = settingsRow?.metadata || {};
    const rawShipping = metadata.shipping;
    const resolvedShipping = {
      freeShippingEnabled: rawShipping?.freeShippingEnabled !== undefined ? Boolean(rawShipping.freeShippingEnabled) : true,
      freeShippingThreshold: typeof rawShipping?.freeShippingThreshold === "number" ? rawShipping.freeShippingThreshold : 0,
      shippingFee: typeof rawShipping?.shippingFee === "number" ? rawShipping.shippingFee : 50,
    };

    // Resolve the store's active plan for feature rendering on the storefront
    const plan = await this.resolveStorePlan(s.id, supabase);

    // Always load fresh appearance, categories, collections, and products for live store accuracy
    const appearance = await supabaseAppearanceRepository.getSettings(s.id, supabase);
    const categories = await supabaseCategoryRepository.getAll(s.id, supabase);
    const collections = await supabaseCollectionRepository.getAll(s.id, supabase);
    const { products } = await supabaseProductRepository.getAll(s.id, undefined, 1, 1000, supabase);

    return {
      id: s.id,
      name: s.name,
      slug: slug,
      plan,
      appearance,
      categories,
      collections,
      products,
      shipping: resolvedShipping,
    };
  }

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
