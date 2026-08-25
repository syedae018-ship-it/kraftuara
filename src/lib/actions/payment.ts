"use server";

import crypto from "crypto";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { errorResponse, successResponse } from "@/lib/api-response";
import { ActionResponse } from "@/types";
import { PLANS } from "@/lib/feature-gating";
import { getOrCreateRazorpayPlan } from "@/config/razorpay";
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
  planName: "startup" | "growth" | "pro"
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

    if (isSimulated) {
      const mockSubId = `sub_mock_${Date.now()}`;
      
      // If store ID exists, upsert pending subscription record
      if (storeId) {
        const { error: upsertError } = await (supabase.from("subscriptions") as any).upsert({
          store_id: storeId,
          user_id: user.id,
          plan: planName,
          status: "payment_pending",
          razorpay_subscription_id: mockSubId,
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          trial_start: new Date().toISOString(),
          trial_end: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          amount: planConfig.priceMonthly,
          currency: "INR",
        }, { onConflict: "store_id" });

        if (upsertError) {
          throw new Error("Failed to register pending subscription: " + upsertError.message);
        }
      }

      return successResponse({
        subscriptionId: mockSubId,
        keyId: "rzp_test_placeholder",
        isSimulated: true,
      });
    }

    // Real Razorpay Subscription API call with a 3-day trial period
    // Billing starts after 3 days. Epoch timestamp (seconds)
    const trialEndTimestamp = Math.floor(Date.now() / 1000) + 3 * 24 * 60 * 60;
    const planId = await getOrCreateRazorpayPlan(razorpay, planName);
    
    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      total_count: 12,
      quantity: 1,
      customer_notify: 1,
      start_at: trialEndTimestamp, // billing begins after trial
      notes: {
        storeId: storeId || "",
        planName: planName,
      }
    });

    // If store ID exists, save pending subscription details in the DB
    if (storeId) {
      const { error: upsertError } = await (supabase.from("subscriptions") as any).upsert({
        store_id: storeId,
        user_id: user.id,
        plan: planName,
        status: "payment_pending",
        razorpay_subscription_id: subscription.id,
        trial_start: new Date().toISOString(),
        trial_end: new Date(trialEndTimestamp * 1000).toISOString(),
        amount: planConfig.priceMonthly,
        currency: "INR",
      }, { onConflict: "store_id" });

      if (upsertError) {
        throw new Error("Failed to register pending subscription: " + upsertError.message);
      }
    }

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
 * Validates checkout signature on the server and activates entitlements (Dashboard Upgrade flow)
 */
export async function verifySubscriptionPaymentAction(payload: {
  storeId?: string | null;
  paymentId: string;
  subscriptionId: string;
  signature: string;
  planId?: "startup" | "growth" | "pro";
}): Promise<ActionResponse<{ success: boolean }>> {
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

    // Resolve target plan tier
    let targetPlan: "startup" | "growth" | "pro" = payload.planId || "startup";

    if (payload.storeId) {
      const { data: currentSub } = await (supabase.from("subscriptions") as any)
        .select("plan")
        .eq("store_id", payload.storeId)
        .maybeSingle();

      if (!payload.planId && currentSub?.plan && currentSub.plan !== "free") {
        targetPlan = currentSub.plan as any;
      }
    }

    const planConfig = PLANS[targetPlan] || PLANS.startup;

    const razorpay = getRazorpayInstance();
    const isSimulated = !razorpay || payload.subscriptionId.startsWith("sub_mock_");

    if (isSimulated) {
      if (payload.storeId) {
        // Update subscription status to active with trial and amount details
        const { error: updateError } = await (supabase.from("subscriptions") as any).update({
          plan: targetPlan,
          status: "active",
          user_id: user.id,
          razorpay_signature: payload.signature || "mock_signature",
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          trial_start: new Date().toISOString(),
          trial_end: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          amount: planConfig.priceMonthly,
          currency: "INR",
          updated_at: new Date().toISOString(),
        }).eq("store_id", payload.storeId);

        if (updateError) {
          throw new Error("Failed to update subscription: " + updateError.message);
        }

        // Log payment record
        await (supabase.from("payments") as any).insert({
          store_id: payload.storeId,
          plan: targetPlan,
          razorpay_payment_id: payload.paymentId || `pay_mock_${Date.now()}`,
          razorpay_subscription_id: payload.subscriptionId,
          amount: planConfig.priceMonthly,
          currency: "INR",
          status: "successful",
        });

        revalidatePath("/dashboard");
      }
      return successResponse({ success: true }, "Subscription activated (Simulated).");
    }

    // Real cryptographic signature check
    const keySecret = process.env.RAZORPAY_KEY_SECRET || "";
    const expected = crypto
      .createHmac("sha256", keySecret)
      .update(payload.paymentId + "|" + payload.subscriptionId)
      .digest("hex");

    if (expected !== payload.signature) {
      return errorResponse("Cryptographic signature validation failed. Rejecting payment.");
    }

    if (payload.storeId) {
      // Fetch live period timestamps from Razorpay
      let currentStartFromRzp = new Date().toISOString();
      let currentEndFromRzp = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      try {
        const subDetails = await razorpay.subscriptions.fetch(payload.subscriptionId);
        if (subDetails.current_start) {
          currentStartFromRzp = new Date(subDetails.current_start * 1000).toISOString();
        }
        if (subDetails.current_end) {
          currentEndFromRzp = new Date(subDetails.current_end * 1000).toISOString();
        }
      } catch (rzpErr) {
        console.error("Failed to query live Razorpay subscription timings:", rzpErr);
      }

      // Update DB Subscriptions with targetPlan
      const { error: updateError } = await (supabase.from("subscriptions") as any).update({
        plan: targetPlan,
        status: "active",
        user_id: user.id,
        razorpay_signature: payload.signature,
        current_period_start: currentStartFromRzp,
        current_period_end: currentEndFromRzp,
        trial_start: new Date().toISOString(),
        trial_end: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        next_billing_date: currentEndFromRzp,
        amount: planConfig.priceMonthly,
        currency: "INR",
        updated_at: new Date().toISOString(),
      }).eq("store_id", payload.storeId);

      if (updateError) {
        throw new Error("Failed to update subscription in database: " + updateError.message);
      }

      // Insert successful payment record
      await (supabase.from("payments") as any).insert({
        store_id: payload.storeId,
        plan: targetPlan,
        razorpay_payment_id: payload.paymentId,
        razorpay_subscription_id: payload.subscriptionId,
        amount: planConfig.priceMonthly,
        currency: "INR",
        status: "successful",
      });

      revalidatePath("/dashboard");
    }

    return successResponse({ success: true }, "Payment verified. Subscription active.");
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
  planName: "startup" | "growth" | "pro",
  paymentDetails?: {
    subscriptionId?: string | null;
    paymentId?: string | null;
    signature?: string | null;
  }
): Promise<ActionResponse<{ success: boolean }>> {
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

    const planConfig = PLANS[planName];
    if (!planConfig) {
      return errorResponse("Invalid plan tier selection.");
    }

    // Default Trial Period (3 Days)
    const now = new Date();
    const trialStart = now.toISOString();
    const trialEnd = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();
    
    let currentStart = trialStart;
    let currentEnd = trialEnd;
    let nextBillingDate = trialEnd;

    const subscriptionId = paymentDetails?.subscriptionId;
    const paymentId = paymentDetails?.paymentId;
    const signature = paymentDetails?.signature;

    const isSimulated = !subscriptionId || subscriptionId.startsWith("sub_mock_");

    if (isSimulated) {
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

      revalidatePath("/dashboard");
      return successResponse({ success: true }, "Subscription activated (Simulated).");
    }

    // Real Razorpay subscription verification
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return errorResponse("Razorpay gateway signature key is missing on the server.");
    }

    if (!paymentId || !signature) {
      return errorResponse("Missing transaction tokens for verification.");
    }

    // Verify cryptographic signature
    const expected = crypto
      .createHmac("sha256", keySecret)
      .update(paymentId + "|" + subscriptionId)
      .digest("hex");

    if (expected !== signature) {
      // Insert as pending to allow manual review, but gate store access
      await (supabase.from("subscriptions") as any).upsert({
        store_id: storeId,
        user_id: store.user_id,
        plan: planName,
        status: "payment_pending",
        razorpay_subscription_id: subscriptionId,
        amount: planConfig.priceMonthly,
        currency: "INR",
        updated_at: new Date().toISOString(),
      }, { onConflict: "store_id" });
      return errorResponse("Payment verification failed. Security signature is invalid.");
    }

    // Fetch subscription details from Razorpay to get accurate dates
    const razorpay = getRazorpayInstance();
    let currentStartFromRzp = currentStart;
    let currentEndFromRzp = currentEnd;
    let nextBillingFromRzp = nextBillingDate;

    if (razorpay) {
      try {
        const subDetails = await razorpay.subscriptions.fetch(subscriptionId);
        if (subDetails.current_start) {
          currentStartFromRzp = new Date(subDetails.current_start * 1000).toISOString();
        }
        if (subDetails.current_end) {
          currentEndFromRzp = new Date(subDetails.current_end * 1000).toISOString();
          nextBillingFromRzp = currentEndFromRzp;
        }
      } catch (rzpErr) {
        console.error("Failed to fetch Razorpay subscription details:", rzpErr);
      }
    }

    // Create/update active subscription in database
    const { error: upsertError } = await (supabase.from("subscriptions") as any).upsert({
      store_id: storeId,
      user_id: store.user_id,
      plan: planName,
      status: "active",
      razorpay_subscription_id: subscriptionId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
      current_period_start: currentStartFromRzp,
      current_period_end: currentEndFromRzp,
      trial_start: trialStart,
      trial_end: trialEnd,
      next_billing_date: nextBillingFromRzp,
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
      plan: planName,
      razorpay_payment_id: paymentId,
      razorpay_subscription_id: subscriptionId,
      amount: planConfig.priceMonthly,
      currency: "INR",
      status: "successful",
    });

    revalidatePath("/dashboard");
    return successResponse({ success: true }, "Subscription activated.");
  } catch (err: any) {
    console.error("Subscription activation error:", err);
    return errorResponse(err.message || "Failed to activate subscription.");
  }
}
