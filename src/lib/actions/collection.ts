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

export async function createCollectionAction(
  storeId: string,
  input: CreateCollectionInput
): Promise<ActionResponse<Collection>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { store } = await verifyStoreCollectionAccess(supabase, storeId);

    const slug = input.slug || input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    const { data, error } = await (supabase.from("collections") as any)
      .insert({
        store_id: storeId,
        name: input.name.trim(),
        slug,
        description: input.description?.trim() || null,
        cover_image_url: input.coverImage || null,
        selected_product_ids: input.selectedProductIds || [],
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
    if (input.name !== undefined) updatePayload.name = input.name.trim();
    if (input.slug !== undefined) updatePayload.slug = input.slug.trim();
    if (input.description !== undefined) updatePayload.description = input.description?.trim() || null;
    if (input.coverImage !== undefined) updatePayload.cover_image_url = input.coverImage || null;
    if (input.selectedProductIds !== undefined) updatePayload.selected_product_ids = input.selectedProductIds;
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
