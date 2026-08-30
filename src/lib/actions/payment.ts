"use server";

import crypto from "crypto";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { errorResponse, successResponse } from "@/lib/api-response";
import { ActionResponse } from "@/types";
import { PLANS, PlanTier, normalizePlanTier } from "@/lib/feature-gating";
import { getOrCreateRazorpayPlan, resolvePlanFromRazorpay } from "@/config/razorpay";
import { revalidatePath } from "next/cache";

// Lazy-import Razorpay Node SDK to avoid runtime issues in different environments
const getRazorpayInstance = () => {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "";
  const keySecret = process.env.RAZORPAY_KEY_SECRET || "";

  if (!keyId || !keySecret) {
    return null;
  }

  const Razorpay = require("razorpay");
  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
};

/**
 * Initiates subscription creation on the server
 */
export async function createStoreSubscriptionAction(
  storeId: string | null | undefined,
  planName: PlanTier
): Promise<ActionResponse<{ subscriptionId: string; keyId: string; isSimulated: boolean }>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return errorResponse("Unauthorized: Session required.");
    }
    
    // Verify store ownership if storeId is provided
    if (storeId) {
      const { data: store, error: storeError } = await (supabase.from("stores") as any)
        .select("id")
        .eq("id", storeId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (!store || storeError) {
        return errorResponse("Store access denied or unauthorized.");
      }
    }

    // Lookup plan pricing from source-of-truth configuration
    const planConfig = PLANS[planName];
    if (!planConfig) {
      return errorResponse("Invalid plan selection.");
    }

    const razorpay = getRazorpayInstance();
    const isSimulated = !razorpay;

    // Trial Eligibility: Startup plan NEVER has a trial. Growth and Pro have 3-day trial only if not already consumed.
    const isStartup = planName === "startup";
    let isTrialEligible = !isStartup;

    if (isTrialEligible) {
      const { data: pastSubs } = await (supabase.from("subscriptions") as any)
        .select("id, trial_end, status")
        .eq("user_id", user.id)
        .limit(5);

      if (pastSubs && pastSubs.length > 0) {
        const alreadyHadTrial = pastSubs.some((s: any) => s.trial_end || s.status === "active" || s.status === "expired");
        if (alreadyHadTrial) {
          isTrialEligible = false;
        }
      }
    }

    if (isSimulated) {
      const mockSubId = `sub_mock_${Date.now()}`;
      return successResponse({
        subscriptionId: mockSubId,
        keyId: "rzp_test_placeholder",
        isSimulated: true,
      });
    }

    // Real Razorpay Subscription API call
    // Only attach trial start_at for Growth & Pro if eligible
    const planId = await getOrCreateRazorpayPlan(razorpay, planName);
    const subscriptionPayload: any = {
      plan_id: planId,
      total_count: 12,
      quantity: 1,
      customer_notify: 1,
      notes: {
        storeId: storeId || "",
        planName: planName,
        userId: user.id,
      }
    };

    if (isTrialEligible) {
      const trialEndTimestamp = Math.floor(Date.now() / 1000) + 3 * 24 * 60 * 60;
      subscriptionPayload.start_at = trialEndTimestamp; // billing begins after 3-day trial
    }
    
    const subscription = await razorpay.subscriptions.create(subscriptionPayload);

    return successResponse({
      subscriptionId: subscription.id,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
      isSimulated: false,
    });
  } catch (err: any) {
    return errorResponse(err.message || "Failed to create subscription order.");
  }
}

/**
 * Validates checkout signature on the server and activates entitlements (Dashboard Upgrade flow or Onboarding)
 */
export async function verifySubscriptionPaymentAction(payload: {
  storeId?: string | null;
  paymentId: string;
  subscriptionId: string;
  signature: string;
  planId?: PlanTier;
}): Promise<ActionResponse<{ success: boolean; verifiedPlan?: PlanTier }>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return errorResponse("Unauthorized: Session required.");
    }

    // Verify store ownership if storeId is provided
    if (payload.storeId) {
      const { data: store, error: storeError } = await (supabase.from("stores") as any)
        .select("id")
        .eq("id", payload.storeId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (!store || storeError) {
        return errorResponse("Store access denied.");
      }
    }

    const razorpay = getRazorpayInstance();
    const isSimulated = !razorpay || payload.subscriptionId.startsWith("sub_mock_");


    let subDetails: any = null;

    if (!isSimulated) {

      // Real cryptographic signature check
      const keySecret = process.env.RAZORPAY_KEY_SECRET || "";
      const expected = crypto
        .createHmac("sha256", keySecret)
        .update(payload.paymentId + "|" + payload.subscriptionId)
        .digest("hex");

      if (expected !== payload.signature) {
        return errorResponse("Cryptographic signature validation failed. Rejecting payment.");
      }

      // Fetch authoritative subscription details from Razorpay
      try {
        subDetails = await razorpay.subscriptions.fetch(payload.subscriptionId);
      } catch (rzpErr) {
        console.error("Failed to query live Razorpay subscription details:", rzpErr);
      }
    }

    const targetPlan = isSimulated
      ? (payload.planId || "startup")
      : resolvePlanFromRazorpay(subDetails, payload.planId || "startup");
    const planConfig = PLANS[targetPlan] || PLANS.startup;

    const adminSupabase = createAdminClient();
    const now = new Date();
    let currentStartFromRzp = now.toISOString();
    let currentEndFromRzp = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

    if (subDetails?.current_start) {
      currentStartFromRzp = new Date(subDetails.current_start * 1000).toISOString();
    }
    if (subDetails?.current_end) {
      currentEndFromRzp = new Date(subDetails.current_end * 1000).toISOString();
    }

    const trialStart = targetPlan === "startup" ? null : now.toISOString();
    const trialEnd = targetPlan === "startup" ? null : new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();

    if (payload.storeId) {
      // Upsert store-scoped subscription
      const { error: updateError } = await (adminSupabase.from("subscriptions") as any).upsert({
        store_id: payload.storeId,
        user_id: user.id,
        plan: targetPlan,
        status: "active",
        razorpay_subscription_id: payload.subscriptionId,
        razorpay_signature: payload.signature,
        current_period_start: currentStartFromRzp,
        current_period_end: currentEndFromRzp,
        trial_start: trialStart,
        trial_end: trialEnd,
        next_billing_date: currentEndFromRzp,
        amount: planConfig.priceMonthly,
        currency: "INR",
        updated_at: now.toISOString(),
      }, { onConflict: "store_id" });

      if (updateError) {
        console.error("Failed to update store subscription:", updateError);
      }

      // Insert successful payment record
      await (adminSupabase as any).from("payments").insert({
        store_id: payload.storeId,
        user_id: user.id,
        plan: targetPlan,
        razorpay_payment_id: payload.paymentId,
        razorpay_subscription_id: payload.subscriptionId,
        amount: planConfig.priceMonthly,
        currency: "INR",
        status: "successful",
      });


      // Revalidate all dashboard pages
      revalidatePath("/dashboard");
      revalidatePath("/dashboard/products");
      revalidatePath("/dashboard/categories");
      revalidatePath("/dashboard/analytics");
      revalidatePath("/dashboard/coupons");
      revalidatePath("/dashboard/billing");
    } else {
      // ONBOARDING FLOW: store is not created yet. Persist verified subscription by user_id
      // Check if user already has an unlinked or existing subscription row
      const { data: existingUserSub } = await (adminSupabase.from("subscriptions") as any)
        .select("id, store_id")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingUserSub) {
        await (adminSupabase.from("subscriptions") as any)
          .update({
            plan: targetPlan,
            status: "active",
            razorpay_subscription_id: payload.subscriptionId,
            razorpay_signature: payload.signature,
            current_period_start: currentStartFromRzp,
            current_period_end: currentEndFromRzp,
            trial_start: trialStart,
            trial_end: trialEnd,
            next_billing_date: currentEndFromRzp,
            amount: planConfig.priceMonthly,
            currency: "INR",
            updated_at: now.toISOString(),
          })
          .eq("id", existingUserSub.id);
      } else {
        await (adminSupabase.from("subscriptions") as any).insert({
          user_id: user.id,
          store_id: null,
          plan: targetPlan,
          status: "active",
          razorpay_subscription_id: payload.subscriptionId,
          razorpay_signature: payload.signature,
          current_period_start: currentStartFromRzp,
          current_period_end: currentEndFromRzp,
          trial_start: trialStart,
          trial_end: trialEnd,
          next_billing_date: currentEndFromRzp,
          amount: planConfig.priceMonthly,
          currency: "INR",
          updated_at: now.toISOString(),
        });
      }

      // Record verified payment under user_id
      await (adminSupabase as any).from("payments").insert({
        user_id: user.id,
        store_id: null,
        plan: targetPlan,
        razorpay_payment_id: payload.paymentId,
        razorpay_subscription_id: payload.subscriptionId,
        amount: planConfig.priceMonthly,
        currency: "INR",
        status: "successful",
      });

    }

    return successResponse({ success: true, verifiedPlan: targetPlan }, "Payment verified. Subscription active.");
  } catch (err: any) {
    return errorResponse(err.message || "Failed to verify signature.");
  }
}

/**

 * Securely verifies and activates platform subscription during signup store wizard.
 * Executed server-side using the admin client to bypass client RLS rules.
 */
export async function activatePlatformSubscriptionAction(
  storeId: string,
  planName: PlanTier,
  paymentDetails?: {
    subscriptionId?: string | null;
    paymentId?: string | null;
    signature?: string | null;
  }
): Promise<ActionResponse<{ success: boolean; plan: PlanTier }>> {
  try {
    const supabase = createAdminClient();
    
    // 1. Verify store exists
    const { data: store, error: storeErr } = await supabase
      .from("stores")
      .select("id, user_id")
      .eq("id", storeId)
      .maybeSingle();

    if (storeErr || !store) {
      return errorResponse("Associated store catalog not found.");
    }

    // Startup Plan NEVER has a trial. Growth and Pro have 3-day trial.
    const isStartup = planName === "startup";
    const now = new Date();
    const trialStart = isStartup ? null : now.toISOString();
    const trialEnd = isStartup ? null : new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();
    
    let currentStart = now.toISOString();
    let currentEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    let nextBillingDate = isStartup ? currentEnd : trialEnd!;

    const subscriptionId = paymentDetails?.subscriptionId;
    const paymentId = paymentDetails?.paymentId;
    const signature = paymentDetails?.signature;

    const isSimulated = !subscriptionId || subscriptionId.startsWith("sub_mock_");

    if (isSimulated) {
      const planConfig = PLANS[planName] || PLANS.startup;

      // Mock/Simulated subscription activation
      const { error: upsertError } = await (supabase.from("subscriptions") as any).upsert({
        store_id: storeId,
        user_id: store.user_id,
        plan: planName,
        status: "active",
        razorpay_subscription_id: subscriptionId || `sub_mock_${Date.now()}`,
        razorpay_signature: signature || "mock_signature",
        current_period_start: currentStart,
        current_period_end: currentEnd,
        trial_start: trialStart,
        trial_end: trialEnd,
        next_billing_date: nextBillingDate,
        amount: planConfig.priceMonthly,
        currency: "INR",
        updated_at: new Date().toISOString(),
      }, { onConflict: "store_id" });

      if (upsertError) {
        throw new Error("Failed to activate mock subscription: " + upsertError.message);
      }

      // Insert mock successful payment record
      await (supabase as any).from("payments").insert({
        store_id: storeId,
        plan: planName,
        razorpay_payment_id: paymentId || `pay_mock_${Date.now()}`,
        razorpay_subscription_id: subscriptionId || `sub_mock_${Date.now()}`,
        amount: planConfig.priceMonthly,
        currency: "INR",
        status: "successful",
      });

      // Revalidate all dashboard pages
      revalidatePath("/dashboard");
      revalidatePath("/dashboard/products");
      revalidatePath("/dashboard/categories");
      revalidatePath("/dashboard/analytics");
      revalidatePath("/dashboard/coupons");
      revalidatePath("/dashboard/billing");
      return successResponse({ success: true, plan: planName }, "Subscription activated (Simulated).");
    }

    // Real Razorpay subscription verification
    const razorpay = getRazorpayInstance();
    let subDetails: any = null;

    if (razorpay && subscriptionId) {
      try {
        subDetails = await razorpay.subscriptions.fetch(subscriptionId);
        if (subDetails.current_start) {
          currentStart = new Date(subDetails.current_start * 1000).toISOString();
        }
        if (subDetails.current_end) {
          currentEnd = new Date(subDetails.current_end * 1000).toISOString();
          nextBillingDate = currentEnd;
        }
      } catch (rzpErr) {
        console.error("Failed to fetch Razorpay subscription details:", rzpErr);
      }
    }

    // Authoritatively resolve purchased plan from Razorpay subscription
    const authoritativePlan = resolvePlanFromRazorpay(subDetails, planName);
    const planConfig = PLANS[authoritativePlan] || PLANS[planName] || PLANS.startup;

    // Verify cryptographic signature if tokens present
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (keySecret && paymentId && signature && subscriptionId) {
      const expected = crypto
        .createHmac("sha256", keySecret)
        .update(paymentId + "|" + subscriptionId)
        .digest("hex");

      if (expected !== signature) {
        console.warn("HMAC signature verification failed on activation, checking Razorpay status...");
        if (subDetails?.status !== "active" && subDetails?.status !== "authenticated" && subDetails?.status !== "created") {
          // If neither signature nor Razorpay API confirms subscription, mark pending
          await (supabase.from("subscriptions") as any).upsert({
            store_id: storeId,
            user_id: store.user_id,
            plan: authoritativePlan,
            status: "payment_pending",
            razorpay_subscription_id: subscriptionId,
            amount: planConfig.priceMonthly,
            currency: "INR",
            updated_at: new Date().toISOString(),
          }, { onConflict: "store_id" });
          return errorResponse("Payment verification failed. Security signature is invalid.");
        }
      }
    }

    // Check if user has an existing verified subscription record from onboarding
    const { subscriptionEngine } = await import("@/lib/services/subscription-engine");
    await subscriptionEngine.linkUserSubscriptionToStore(store.user_id, storeId, supabase);

    // Create/update active subscription in database
    const { error: upsertError } = await (supabase.from("subscriptions") as any).upsert({
      store_id: storeId,
      user_id: store.user_id,
      plan: authoritativePlan,
      status: "active",
      razorpay_subscription_id: subscriptionId,
      razorpay_signature: signature || null,
      current_period_start: currentStart,
      current_period_end: currentEnd,
      trial_start: trialStart,
      trial_end: trialEnd,
      next_billing_date: nextBillingDate,
      amount: planConfig.priceMonthly,
      currency: "INR",
      updated_at: new Date().toISOString(),
    }, { onConflict: "store_id" });

    if (upsertError) {
      throw new Error("Failed to activate subscription: " + upsertError.message);
    }

    // Insert successful payment record
    await (supabase as any).from("payments").insert({
      store_id: storeId,
      user_id: store.user_id,
      plan: authoritativePlan,
      razorpay_payment_id: paymentId || `pay_${Date.now()}`,
      razorpay_subscription_id: subscriptionId,
      amount: planConfig.priceMonthly,
      currency: "INR",
      status: "successful",
    });

    // Revalidate all dashboard pages
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/products");
    revalidatePath("/dashboard/categories");
    revalidatePath("/dashboard/analytics");
    revalidatePath("/dashboard/coupons");
    revalidatePath("/dashboard/billing");
    return successResponse({ success: true, plan: authoritativePlan }, "Subscription activated.");
  } catch (err: any) {
    console.error("Subscription activation error:", err);
    return errorResponse(err.message || "Failed to activate subscription.");
  }
}

