"use server";

import { createServerInstance } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/services/admin-roles";



// Types
export interface StoreSubscription {
  id?: string;
  storeId: string;
  plan: "startup" | "growth" | "pro";
  selectedPlan?: "startup" | "growth" | "pro";
  status: "active" | "expired" | "cancelled" | "pending" | "payment_pending";
  expiresAt: string | null;
  startsAt: string | null;
  daysRemaining: number | null;
}

/**
 * Server action to get store-scoped subscription details.
 * Downgrades entitlement resolution to 'startup' tier if a paid subscription expires.
 */
export async function getStoreSubscriptionAction(storeId: string) {
  try {
    const supabase = await createServerInstance();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // Verify store ownership
    const { data: storeRow } = await supabase
      .from("stores")
      .select("id")
      .eq("id", storeId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!storeRow) throw new Error("Access Denied: You do not own this store.");

    // Delegate to centralized authoritative subscription engine
    const { subscriptionEngine } = await import("@/lib/services/subscription-engine");
    const authSub = await subscriptionEngine.getAuthoritativeSubscription(storeId, user.id, supabase);

    return {
      success: true,
      subscription: {
        storeId,
        plan: authSub.plan,
        selectedPlan: authSub.plan,
        status: authSub.status,
        expiresAt: authSub.currentPeriodEnd,
        startsAt: authSub.currentPeriodStart,
        daysRemaining: authSub.daysRemaining,
      } as StoreSubscription,
    };
  } catch (err: any) {
    console.error("Get Subscription Error:", err);
    return { success: false, error: err.message || "Failed to load subscription details." };
  }

}

/**
 * Authorized Super Admin action to override plan subscriptions.
 */
export async function updateStoreSubscriptionAction(
  storeId: string,
  plan: "startup" | "growth" | "pro",
  status: "active" | "expired" | "cancelled" | "pending",
  expiryDays?: number
) {
  try {
    const supabase = await createServerInstance();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // Verify caller is a legitimate Admin User
    const isAdmin = isAdminUser(user.email, user.user_metadata?.role);
    if (!isAdmin) {
      throw new Error("Access Denied: Super Admin privileges required.");
    }

    const startsAt = new Date().toISOString();
    const expiresAt = expiryDays 
      ? new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toISOString() 
      : null;

    const { error } = await (supabase.from("subscriptions") as any)
      .upsert({
        store_id: storeId,
        plan,
        status,
        current_period_start: startsAt,
        current_period_end: expiresAt,
        updated_at: new Date().toISOString(),
      }, { onConflict: "store_id" });

    if (error) throw new Error(error.message);

    return { success: true };
  } catch (err: any) {
    console.error("Admin plan update error:", err);
    return { success: false, error: err.message || "Failed to override subscription." };
  }
}
