import { Coupon, CreateCouponInput, UpdateCouponInput } from "@/types/coupon";
import { createClient } from "@/lib/supabase/client";
import { ICouponRepository } from "../coupon-repository";

export class SupabaseCouponRepository implements ICouponRepository {
  private getSupabase() {
    return createClient();
  }

  private async checkStoreOwnerAndPlan(storeId: string, client?: any) {
    const supabase = client || this.getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // 1. Verify owner
    const { data: storeRow } = await supabase
      .from("stores")
      .select("id")
      .eq("id", storeId)
      .eq("user_id", user.id)
      .maybeSingle();
      
    if (!storeRow) throw new Error("Access Denied: You do not own this store.");

    // 2. Verify plan
    const { data: subRow } = await (supabase.from("subscriptions") as any)
      .select("plan, status, current_period_end")
      .eq("store_id", storeId)
      .maybeSingle();

    const { normalizePlanTier, hasFeatureAccess } = await import("@/lib/feature-gating");

    let plan: "startup" | "growth" | "pro" = "startup";
    let status = subRow?.status || "active";
    const expiresAt = subRow?.current_period_end;

    if (subRow) {
      plan = normalizePlanTier(subRow.plan);
      if (expiresAt && new Date(expiresAt).getTime() < Date.now()) {
        status = "expired";
      }
    }

    if (status === "expired" || status === "cancelled" || status === "pending" || status === "payment_pending") {
      plan = "startup";
    }

    if (!hasFeatureAccess(plan, "coupons")) {
      throw new Error("Promo codes and coupons are exclusive to Growth and Pro plans. Please upgrade to unlock coupons.");
    }
  }

  async getAll(storeId: string, client?: any): Promise<Coupon[]> {
    const supabase = client || this.getSupabase();
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false });

    if (error || !data) return [];

    return data.map((row: any) => ({
      id: row.id,
      storeId: row.store_id,
      code: row.code,
      discountType: row.discount_type,
      value: Number(row.value),
      expiryDate: row.expiry_date || undefined,
      usageLimit: row.usage_limit || undefined,
      usageCount: row.usage_count || 0,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  async getById(id: string, client?: any): Promise<Coupon | null> {
    const supabase = client || this.getSupabase();
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) return null;

    const row = data as any;
    return {
      id: row.id,
      storeId: row.store_id,
      code: row.code,
      discountType: row.discount_type,
      value: Number(row.value),
      expiryDate: row.expiry_date || undefined,
      usageLimit: row.usage_limit || undefined,
      usageCount: row.usage_count || 0,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async getByCode(storeId: string, code: string, client?: any): Promise<Coupon | null> {
    const supabase = client || this.getSupabase();
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("store_id", storeId)
      .eq("code", code.trim().toUpperCase())
      .maybeSingle();

    if (error || !data) return null;

    const row = data as any;
    return {
      id: row.id,
      storeId: row.store_id,
      code: row.code,
      discountType: row.discount_type,
      value: Number(row.value),
      expiryDate: row.expiry_date || undefined,
      usageLimit: row.usage_limit || undefined,
      usageCount: row.usage_count || 0,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async create(storeId: string, input: CreateCouponInput, client?: any): Promise<Coupon> {
    const supabase = client || this.getSupabase();
    await this.checkStoreOwnerAndPlan(storeId, supabase);

    const { data, error } = await supabase
      .from("coupons")
      .insert({
        store_id: storeId,
        code: input.code.trim().toUpperCase(),
        discount_type: input.discountType,
        value: Number(input.value),
        expiry_date: input.expiryDate || null,
        usage_limit: input.usageLimit || null,
        status: input.status || "active",
      } as any)
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || "Failed to create coupon");
    }

    const row = data as any;
    return {
      id: row.id,
      storeId: row.store_id,
      code: row.code,
      discountType: row.discount_type,
      value: Number(row.value),
      expiryDate: row.expiry_date || undefined,
      usageLimit: row.usage_limit || undefined,
      usageCount: row.usage_count || 0,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async update(id: string, input: UpdateCouponInput, client?: any): Promise<Coupon | null> {
    const supabase = client || this.getSupabase();
    const { data: rawRow } = await supabase.from("coupons").select("store_id").eq("id", id).maybeSingle();
    if (!rawRow) return null;

    await this.checkStoreOwnerAndPlan(rawRow.store_id, supabase);

    const { data, error } = await supabase
      .from("coupons")
      .update({
        code: input.code?.trim().toUpperCase(),
        discount_type: input.discountType,
        value: input.value !== undefined ? Number(input.value) : undefined,
        expiry_date: input.expiryDate,
        usage_limit: input.usageLimit,
        status: input.status,
      } as any)
      .eq("id", id)
      .select()
      .single();

    if (error || !data) return null;

    const row = data as any;
    return {
      id: row.id,
      storeId: row.store_id,
      code: row.code,
      discountType: row.discount_type,
      value: Number(row.value),
      expiryDate: row.expiry_date || undefined,
      usageLimit: row.usage_limit || undefined,
      usageCount: row.usage_count || 0,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async delete(id: string, client?: any): Promise<boolean> {
    const supabase = client || this.getSupabase();
    const { data: rawRow } = await supabase.from("coupons").select("store_id").eq("id", id).maybeSingle();
    if (!rawRow) return false;

    await this.checkStoreOwnerAndPlan(rawRow.store_id, supabase);

    const { error } = await supabase.from("coupons").delete().eq("id", id);
    return !error;
  }

  async validateCoupon(storeId: string, code: string, subtotal: number, client?: any): Promise<{ success: boolean; discountAmount: number; error?: string; coupon?: Coupon }> {
    let supabase: any = client;
    if (!supabase) {
      if (typeof window === "undefined") {
        try {
          const { createAdminClient } = await import("@/lib/supabase/admin");
          supabase = createAdminClient();
        } catch (e) {
          supabase = this.getSupabase();
        }
      } else {
        supabase = this.getSupabase();
      }
    }
    
    // 1. Demo stores fallback for seamless testing
    if (storeId === "demo-craft-classic-id" || storeId.startsWith("demo-") || storeId === "demo") {
      const normalizedCode = code.trim().toUpperCase();
      if (normalizedCode === "WELCOME10" || normalizedCode === "FESTIVE10" || normalizedCode === "SAVE10") {
        const discountAmount = Math.min(subtotal, (subtotal * 10) / 100);
        return {
          success: true,
          discountAmount,
          coupon: {
            id: "demo-coupon-10",
            storeId,
            code: normalizedCode,
            discountType: "percentage",
            value: 10,
            usageCount: 0,
            status: "active",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        };
      } else if (normalizedCode === "SAVE50" || normalizedCode === "FLAT50" || normalizedCode === "FLAT100") {
        const flatVal = normalizedCode === "FLAT100" ? 100 : 50;
        const discountAmount = Math.min(subtotal, flatVal);
        return {
          success: true,
          discountAmount,
          coupon: {
            id: `demo-coupon-${flatVal}`,
            storeId,
            code: normalizedCode,
            discountType: "flat",
            value: flatVal,
            usageCount: 0,
            status: "active",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        };
      }
      return { success: false, discountAmount: 0, error: "Invalid coupon code." };
    }

    // 2. Fetch authoritative store subscription entitlement
    const { data: subRow } = await (supabase.from("subscriptions") as any)
      .select("plan, status, current_period_end")
      .eq("store_id", storeId)
      .maybeSingle();

    const { normalizePlanTier, hasFeatureAccess } = await import("@/lib/feature-gating");

    let plan: "startup" | "growth" | "pro" = "startup";
    let status = subRow?.status || "active";
    const expiresAt = subRow?.current_period_end;

    if (subRow) {
      plan = normalizePlanTier(subRow.plan);
      if (expiresAt && new Date(expiresAt).getTime() < Date.now()) {
        status = "expired";
      }
    }

    if (status === "expired" || status === "cancelled" || status === "pending" || status === "payment_pending") {
      plan = "startup";
    }

    // Check if store's active subscription tier supports coupons
    if (!hasFeatureAccess(plan, "coupons")) {
      return { 
        success: false, 
        discountAmount: 0, 
        error: "Coupons are not supported on the store's current plan." 
      };
    }

    // 3. Query the store's coupon record
    const { data: couponRow, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("store_id", storeId)
      .eq("code", code.trim().toUpperCase())
      .maybeSingle();

    if (error || !couponRow) {
      return { success: false, discountAmount: 0, error: "Invalid coupon code." };
    }

    if (couponRow.status !== "active") {
      return { success: false, discountAmount: 0, error: "This coupon is currently inactive." };
    }

    if (couponRow.expiry_date && new Date(couponRow.expiry_date).getTime() < Date.now()) {
      return { success: false, discountAmount: 0, error: "This coupon has expired." };
    }

    if (couponRow.usage_limit !== null && couponRow.usage_limit !== undefined && couponRow.usage_count >= couponRow.usage_limit) {
      return { success: false, discountAmount: 0, error: "This coupon has reached its maximum usage limit." };
    }

    let discountAmount = 0;
    if (couponRow.discount_type === "percentage") {
      discountAmount = (subtotal * Number(couponRow.value)) / 100;
    } else {
      discountAmount = Number(couponRow.value);
    }

    // Cap discount to subtotal
    if (discountAmount > subtotal) {
      discountAmount = subtotal;
    }

    // Ensure non-negative and valid number
    discountAmount = Math.max(0, isNaN(discountAmount) ? 0 : discountAmount);

    return {
      success: true,
      discountAmount,
      coupon: {
        id: couponRow.id,
        storeId: couponRow.store_id,
        code: couponRow.code,
        discountType: couponRow.discount_type as any,
        value: Number(couponRow.value),
        expiryDate: couponRow.expiry_date || undefined,
        usageLimit: couponRow.usage_limit || undefined,
        usageCount: couponRow.usage_count || 0,
        status: couponRow.status as any,
        createdAt: couponRow.created_at,
        updatedAt: couponRow.updated_at,
      }
    };
  }
}

export const supabaseCouponRepository = new SupabaseCouponRepository();
