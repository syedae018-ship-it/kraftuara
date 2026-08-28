"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { CreateCollectionInput, Collection } from "@/types/collection";
import { revalidatePath } from "next/cache";

interface ActionResponse<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function verifyStoreCollectionAccess(supabase: any, storeId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: storeRow } = await supabase
    .from("stores")
    .select("id, slug")
    .eq("id", storeId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!storeRow) throw new Error("Access Denied: You do not own this store.");

  // Check Pro Plan entitlement
  const { data: subRow } = await (supabase.from("subscriptions") as any)
    .select("plan, status, current_period_end")
    .eq("store_id", storeId)
    .maybeSingle();

  const { normalizePlanTier, hasFeatureAccess } = await import("@/lib/feature-gating");
  let plan = "startup";
  let subStatus = subRow?.status || "active";
  if (subRow) {
    plan = normalizePlanTier(subRow.plan);
    if (subRow.current_period_end && new Date(subRow.current_period_end).getTime() < Date.now()) {
      subStatus = "expired";
    }
  }
  if (subStatus === "expired" || subStatus === "cancelled" || subStatus === "pending") {
    plan = "startup";
  }

  if (!hasFeatureAccess(plan, "collections")) {
    throw new Error("Product Collections are exclusive to the Pro Plan.");
  }

  return { store: storeRow, user };
}

/**
 * Validates that all provided product IDs are valid UUIDs and belong to the specified store.
 */
async function validateStoreProductIds(supabase: any, storeId: string, rawProductIds?: string[]): Promise<string[]> {
  if (!rawProductIds || !Array.isArray(rawProductIds) || rawProductIds.length === 0) {
    return [];
  }

  // 1. Check format of all IDs
  for (const id of rawProductIds) {
    if (typeof id !== "string" || !UUID_REGEX.test(id.trim())) {
      throw new Error("Invalid product identifier. Please select valid store products.");
    }
  }

  const cleanIds = rawProductIds.map((id) => id.trim());
  const uniqueIds = Array.from(new Set(cleanIds));

  // 2. Query database to verify ownership of all selected products
  const { data: dbProducts, error: prodError } = await supabase
    .from("products")
    .select("id")
    .eq("store_id", storeId)
    .in("id", uniqueIds);

  if (prodError || !dbProducts) {
    throw new Error("We couldn't verify the selected products. Please refresh and try again.");
  }

  if (dbProducts.length !== uniqueIds.length) {
    throw new Error("One or more selected products do not belong to this store or no longer exist.");
  }

  // Return clean list preserving merchant's selection order
  return cleanIds.filter((id) => uniqueIds.includes(id));
}

/**
 * Generates a collision-free slug for a store collection.
 */
async function generateUniqueCollectionSlug(
  supabase: any,
  storeId: string,
  rawSlugOrName: string,
  excludeCollectionId?: string
): Promise<string> {
  const baseSlug = rawSlugOrName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "collection";

  let finalSlug = baseSlug;
  let counter = 1;

  while (true) {
    let query = supabase
      .from("collections")
      .select("id")
      .eq("store_id", storeId)
      .eq("slug", finalSlug);

    if (excludeCollectionId) {
      query = query.neq("id", excludeCollectionId);
    }

    const { data } = await query.maybeSingle();
    if (!data) break;
    finalSlug = `${baseSlug}-${counter++}`;
  }

  return finalSlug;
}

export async function createCollectionAction(
  storeId: string,
  input: CreateCollectionInput
): Promise<ActionResponse<Collection>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { store } = await verifyStoreCollectionAccess(supabase, storeId);

    if (!input.name || !input.name.trim()) {
      return { success: false, error: "Please enter a collection name." };
    }

    const validatedProductIds = await validateStoreProductIds(supabase, storeId, input.selectedProductIds);
    const slug = await generateUniqueCollectionSlug(supabase, storeId, input.slug || input.name);

    const { data, error } = await (supabase.from("collections") as any)
      .insert({
        store_id: storeId,
        name: input.name.trim(),
        slug,
        description: input.description?.trim() || null,
        cover_image_url: input.coverImage || null,
        selected_product_ids: validatedProductIds,
      })
      .select()
      .single();

    if (error || !data) {
      return { success: false, error: error?.message || "We couldn't create the collection. Please try again." };
    }

    revalidatePath(`/store/${store.slug}`);
    revalidatePath("/dashboard/collections");

    return {
      success: true,
      data: {
        id: data.id,
        name: data.name,
        slug: data.slug,
        description: data.description || undefined,
        coverImage: data.cover_image_url || undefined,
        status: "published",
        displayOrder: 0,
        selectedProductIds: data.selected_product_ids || [],
        productCount: (data.selected_product_ids || []).length,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to create collection." };
  }
}

export async function updateCollectionAction(
  storeId: string,
  collectionId: string,
  input: Partial<Collection>
): Promise<ActionResponse<void>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { store } = await verifyStoreCollectionAccess(supabase, storeId);

    const updatePayload: any = {};
    if (input.name !== undefined) {
      if (!input.name.trim()) {
        return { success: false, error: "Collection name cannot be empty." };
      }
      updatePayload.name = input.name.trim();
    }

    if (input.slug !== undefined || input.name !== undefined) {
      const targetSlug = input.slug || input.name || "";
      if (targetSlug) {
        updatePayload.slug = await generateUniqueCollectionSlug(supabase, storeId, targetSlug, collectionId);
      }
    }

    if (input.description !== undefined) {
      updatePayload.description = input.description?.trim() || null;
    }
    if (input.coverImage !== undefined) {
      updatePayload.cover_image_url = input.coverImage || null;
    }
    if (input.selectedProductIds !== undefined) {
      updatePayload.selected_product_ids = await validateStoreProductIds(supabase, storeId, input.selectedProductIds);
    }
    updatePayload.updated_at = new Date().toISOString();

    const { error } = await (supabase.from("collections") as any)
      .update(updatePayload)
      .eq("id", collectionId)
      .eq("store_id", storeId);

    if (error) {
      return { success: false, error: error.message || "Failed to update collection." };
    }

    revalidatePath(`/store/${store.slug}`);
    revalidatePath("/dashboard/collections");

    return { success: true, message: "Collection updated successfully." };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update collection." };
  }
}

export async function deleteCollectionAction(
  storeId: string,
  collectionId: string
): Promise<ActionResponse<void>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { store } = await verifyStoreCollectionAccess(supabase, storeId);

    const { error } = await (supabase.from("collections") as any)
      .delete()
      .eq("id", collectionId)
      .eq("store_id", storeId);

    if (error) {
      return { success: false, error: error.message || "Failed to delete collection." };
    }

    revalidatePath(`/store/${store.slug}`);
    revalidatePath("/dashboard/collections");

    return { success: true, message: "Collection deleted successfully." };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete collection." };
  }
}

export async function duplicateCollectionAction(
  storeId: string,
  collectionId: string
): Promise<ActionResponse<Collection>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { store } = await verifyStoreCollectionAccess(supabase, storeId);

    const { data: source, error: sourceErr } = await (supabase.from("collections") as any)
      .select("*")
      .eq("id", collectionId)
      .eq("store_id", storeId)
      .maybeSingle();

    if (sourceErr || !source) {
      return { success: false, error: "Source collection could not be found." };
    }

    const duplicateName = `${source.name} (Copy)`;
    const duplicateSlug = await generateUniqueCollectionSlug(supabase, storeId, `${source.slug}-copy`);

    // Verify existing product associations are still valid
    const validProductIds = await validateStoreProductIds(supabase, storeId, source.selected_product_ids || []);

    const { data: created, error: createErr } = await (supabase.from("collections") as any)
      .insert({
        store_id: storeId,
        name: duplicateName,
        slug: duplicateSlug,
        description: source.description || null,
        cover_image_url: source.cover_image_url || null,
        selected_product_ids: validProductIds,
      })
      .select()
      .single();

    if (createErr || !created) {
      return { success: false, error: createErr?.message || "Failed to duplicate collection." };
    }

    revalidatePath(`/store/${store.slug}`);
    revalidatePath("/dashboard/collections");

    return {
      success: true,
      data: {
        id: created.id,
        name: created.name,
        slug: created.slug,
        description: created.description || undefined,
        coverImage: created.cover_image_url || undefined,
        status: "published",
        displayOrder: 0,
        selectedProductIds: created.selected_product_ids || [],
        productCount: (created.selected_product_ids || []).length,
        createdAt: created.created_at,
        updatedAt: created.updated_at,
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to duplicate collection." };
  }
}

