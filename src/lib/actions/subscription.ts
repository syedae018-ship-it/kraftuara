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

    // Fetch subscription record
    let { data: subRow, error } = await (supabase.from("subscriptions") as any)
      .select("*")
      .eq("store_id", storeId)
      .maybeSingle();

    if (error) throw new Error(error.message);

    // If no subscription record exists, create default Startup Pack subscription with 3-day trial
    if (!subRow) {
      const nowStr = new Date().toISOString();
      const trialEndStr = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
      
      const { data: newSub, error: insertError } = await (supabase.from("subscriptions") as any)
        .insert({
          store_id: storeId,
          user_id: user.id,
          plan: "startup",
          status: "active",
          current_period_start: nowStr,
          current_period_end: trialEndStr,
          trial_start: nowStr,
          trial_end: trialEndStr,
          next_billing_date: trialEndStr,
          amount: 99,
          currency: "INR",
        })
        .select()
        .single();

      if (insertError) throw new Error("Failed to initialize default subscription.");
      subRow = newSub;
    } else if (subRow && (subRow.plan === "free" || !["startup", "growth", "pro"].includes(subRow.plan))) {
      await (supabase.from("subscriptions") as any)
        .update({
          plan: "startup",
          amount: 99,
          currency: "INR",
          updated_at: new Date().toISOString(),
        })
        .eq("store_id", storeId);
      subRow.plan = "startup";
      subRow.amount = 99;
    }

    const activeSub = subRow!;
    let plan = activeSub.plan as "startup" | "growth" | "pro";
    let status = activeSub.status as "active" | "expired" | "cancelled" | "pending";
    const expiresAt = activeSub.current_period_end;
    const startsAt = activeSub.current_period_start;
    
    let daysRemaining: number | null = null;

    // Handle Expiry Logic
    if (expiresAt) {
      const expiryDate = new Date(expiresAt);
      const currentDate = new Date();
      const diffTime = expiryDate.getTime() - currentDate.getTime();
      daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

      if (diffTime < 0 && status === "active") {
        status = "expired";
        // Update DB status to expired
        await (supabase.from("subscriptions") as any)
          .update({ status: "expired" })
          .eq("store_id", storeId);
      }
    }

    // If status is expired, cancelled (and expired), or pending/unpaid, cancel paid entitlements and downgrade runtime resolved plan to startup
    let resolvedPlan = plan;
    const isExpired = daysRemaining !== null ? daysRemaining <= 0 : true;
    if (
      status === "expired" ||
      (status === "cancelled" && isExpired) ||
      status === "pending" ||
      (status as string) === "payment_pending"
    ) {
      resolvedPlan = "startup";
    }

    return {
      success: true,
      subscription: {
        storeId,
        plan: resolvedPlan,
        selectedPlan: plan,
        status,
        expiresAt,
        startsAt,
        daysRemaining,
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
