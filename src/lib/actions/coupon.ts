"use server";

import { couponRepository } from "@/lib/repositories/coupon-repository";
import { createServerInstance } from "@/lib/supabase/server";
import { CreateCouponInput, UpdateCouponInput } from "@/types/coupon";

async function verifyStoreOwner(supabase: any, storeId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: storeRow } = await supabase
    .from("stores")
    .select("id")
    .eq("id", storeId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!storeRow) throw new Error("Access Denied: You do not own this store.");
  return user.id;
}

export async function getCouponsAction(storeId: string) {
  try {
    const supabase = await createServerInstance();
    await verifyStoreOwner(supabase, storeId);
    const coupons = await couponRepository.getAll(storeId, supabase);
    return { success: true, coupons };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to load coupons" };
  }
}

export async function createCouponAction(storeId: string, input: CreateCouponInput) {
  try {
    const supabase = await createServerInstance();
    await verifyStoreOwner(supabase, storeId);
    const coupon = await couponRepository.create(storeId, input, supabase);
    return { success: true, coupon };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to create coupon" };
  }
}

export async function updateCouponAction(id: string, input: UpdateCouponInput) {
  try {
    const supabase = await createServerInstance();
    const { data: rawRow } = await (supabase.from("coupons") as any).select("store_id").eq("id", id).maybeSingle();
    if (!rawRow) throw new Error("Coupon not found");
    
    await verifyStoreOwner(supabase, rawRow.store_id);
    const coupon = await couponRepository.update(id, input, supabase);
    return { success: true, coupon };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update coupon" };
  }
}

export async function deleteCouponAction(id: string) {
  try {
    const supabase = await createServerInstance();
    const { data: rawRow } = await (supabase.from("coupons") as any).select("store_id").eq("id", id).maybeSingle();
    if (!rawRow) throw new Error("Coupon not found");

    await verifyStoreOwner(supabase, rawRow.store_id);
    const deleted = await couponRepository.delete(id, supabase);
    return { success: true, deleted };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete coupon" };
  }
}

export async function validateCouponAction(storeId: string, code: string, subtotal: number) {
  try {
    let supabase: any;
    try {
      const { createAdminClient } = await import("@/lib/supabase/admin");
      supabase = createAdminClient();
    } catch (e) {
      const { createServerInstance } = await import("@/lib/supabase/server");
      supabase = await createServerInstance();
    }

    // Validation is a public storefront action
    const result = await couponRepository.validateCoupon(storeId, code, subtotal, supabase);
    return result;
  } catch (err: any) {
    return { success: false, discountAmount: 0, error: err.message || "Failed to validate coupon" };
  }
}
