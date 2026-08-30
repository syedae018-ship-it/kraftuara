import { createServerSupabaseClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type PublishStatus =
  | "SAVED"
  | "PUBLISHING"
  | "PUBLISHED"
  | "SYNC_REQUIRED"
  | "PUBLISH_FAILED";

export interface PublishRevision {
  revision: number;
  status: PublishStatus;
  publishedAt?: string;
  lastError?: string;
}

export interface PublishResult {
  success: boolean;
  revision: number;
  status: PublishStatus;
  error?: string;
  message?: string;
}

export class PublishingEngine {
  private async getSupabaseClient(client?: any) {
    if (client) return client;
    return createServerSupabaseClient();
  }


  /**
   * Reads current publication status and revision from store_settings.metadata
   */
  async getPublishStatus(storeId: string, client?: any): Promise<PublishRevision> {
    try {
      const supabase = await this.getSupabaseClient(client);
      const { data: settingsRow } = await (supabase.from("store_settings") as any)
        .select("metadata")
        .eq("store_id", storeId)
        .maybeSingle();

      const meta = settingsRow?.metadata || {};
      const pubMeta = meta.publishing || {};

      return {
        revision: typeof pubMeta.published_revision === "number" ? pubMeta.published_revision : 1,
        status: (pubMeta.publish_status as PublishStatus) || "PUBLISHED",
        publishedAt: pubMeta.published_at || undefined,
        lastError: pubMeta.last_publish_error || undefined,
      };
    } catch {
      return {
        revision: 1,
        status: "PUBLISHED",
      };
    }
  }

  /**
   * Compiles atomic store snapshot, stamps revision, and revalidates live storefront routes.
   */
  async publishStore(
    storeId: string,
    options?: { force?: boolean; supabaseClient?: any; triggeringRevision?: number }
  ): Promise<PublishResult> {
    const supabase = await this.getSupabaseClient(options?.supabaseClient);


    // 1. Fetch store info
    const { data: storeRow, error: storeErr } = await (supabase.from("stores") as any)
      .select("id, name, slug, is_published, user_id")
      .eq("id", storeId)
      .maybeSingle();

    if (storeErr || !storeRow) {
      return {
        success: false,
        revision: options?.triggeringRevision || 0,
        status: "PUBLISH_FAILED",
        error: "Store not found or access denied.",
      };
    }

    try {
      // 2. Fetch fresh published store data
      const { supabaseAppearanceRepository } = await import(
        "@/lib/repositories/supabase/supabase-appearance-repository"
      );
      const { supabaseCategoryRepository } = await import(
        "@/lib/repositories/supabase/supabase-category-repository"
      );
      const { supabaseCollectionRepository } = await import(
        "@/lib/repositories/supabase/supabase-collection-repository"
      );
      const { supabaseProductRepository } = await import(
        "@/lib/repositories/supabase/supabase-product-repository"
      );

      const [appearance, categories, collections, productsRes] = await Promise.all([
        supabaseAppearanceRepository.getSettings(storeId, supabase),
        supabaseCategoryRepository.getAll(storeId, supabase),
        supabaseCollectionRepository.getAll(storeId, supabase),
        supabaseProductRepository.getAll(storeId, undefined, 1, 1000, supabase),
      ]);

      const products = productsRes.products;

      // 3. Load existing settings metadata
      const { data: settingsRow } = await (supabase.from("store_settings") as any)
        .select("id, metadata")
        .eq("store_id", storeId)
        .maybeSingle();

      const existingMetadata = settingsRow?.metadata || {};
      const existingPubMeta = existingMetadata.publishing || {};
      const currentRev = typeof existingPubMeta.published_revision === "number" ? existingPubMeta.published_revision : 0;
      const nextRevision = options?.triggeringRevision ? Math.max(options.triggeringRevision, currentRev + 1) : currentRev + 1;

      const rawShipping = existingMetadata.shipping;
      const shipping = {
        freeShippingEnabled: rawShipping?.freeShippingEnabled !== undefined ? Boolean(rawShipping.freeShippingEnabled) : true,
        freeShippingThreshold: typeof rawShipping?.freeShippingThreshold === "number" ? rawShipping.freeShippingThreshold : 0,
        shippingFee: typeof rawShipping?.shippingFee === "number" ? rawShipping.shippingFee : 50,
      };

      const publishedAt = new Date().toISOString();

      const updatedMetadata = {
        ...existingMetadata,
        shipping,
        publishing: {
          published_revision: nextRevision,
          latest_revision: nextRevision,
          publish_status: "PUBLISHED" as PublishStatus,
          published_at: publishedAt,
          last_publish_error: null,
          updated_at: publishedAt,
        },
        published_snapshot: {
          id: storeId,
          name: storeRow.name,
          slug: storeRow.slug,
          revision: nextRevision,
          publishedAt,
          appearance,
          categories,
          collections,
          products,
          shipping,
        },
      };

      // 4. Save published snapshot & publishing metadata to store_settings
      if (settingsRow) {
        const { error: updateErr } = await (supabase.from("store_settings") as any)
          .update({ metadata: updatedMetadata })
          .eq("id", settingsRow.id);
        if (updateErr) throw updateErr;
      } else {
        const { error: insertErr } = await (supabase.from("store_settings") as any)
          .insert({
            store_id: storeId,
            metadata: updatedMetadata,
          });
        if (insertErr) throw insertErr;
      }

      // 5. Ensure store is_published is true
      if (!storeRow.is_published) {
        await (supabase.from("stores") as any)
          .update({ is_published: true })
          .eq("id", storeId);
      }

      // 6. Revalidate Next.js storefront paths
      const slug = storeRow.slug;
      if (slug) {
        try {
          const { revalidatePath } = await import("next/cache");
          revalidatePath(`/store/${slug}`, "layout");
          revalidatePath(`/store/${slug}`);
          revalidatePath(`/store/${slug}/cart`);
          revalidatePath(`/store/${slug}/contact`);
          revalidatePath(`/store/${slug}/track`);
          revalidatePath("/dashboard/appearance");
        } catch {
          // Path revalidation may be skipped in non-web request contexts
        }
      }


      return {
        success: true,
        revision: nextRevision,
        status: "PUBLISHED",
        message: "Store changes published and live.",
      };
    } catch (err: any) {
      console.error(`Auto-publish error for store ${storeId}:`, err);

      // Record SYNC_REQUIRED in store_settings metadata without losing saved DB data
      try {
        const { data: settingsRow } = await (supabase.from("store_settings") as any)
          .select("id, metadata")
          .eq("store_id", storeId)
          .maybeSingle();

        if (settingsRow) {
          const meta = settingsRow.metadata || {};
          const pubMeta = meta.publishing || {};
          await (supabase.from("store_settings") as any)
            .update({
              metadata: {
                ...meta,
                publishing: {
                  ...pubMeta,
                  publish_status: "SYNC_REQUIRED" as PublishStatus,
                  last_publish_error: err.message || "Failed to compile published snapshot",
                  updated_at: new Date().toISOString(),
                },
              },
            })
            .eq("id", settingsRow.id);
        }
      } catch {
        // Ignore fallback update errors
      }

      return {
        success: false,
        revision: options?.triggeringRevision || 0,
        status: "SYNC_REQUIRED",
        error: err.message || "Storefront synchronization failed.",
      };
    }
  }

  /**
   * Non-blocking auto-publish trigger called immediately following any successful database save.
   */
  async triggerAutoPublish(storeId: string, client?: any): Promise<PublishResult> {
    return this.publishStore(storeId, { supabaseClient: client });
  }
}

export const publishingEngine = new PublishingEngine();
