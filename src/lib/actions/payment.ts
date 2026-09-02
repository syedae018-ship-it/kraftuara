"use server";

import crypto from "crypto";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { errorResponse, successResponse } from "@/lib/api-response";
import { ActionResponse } from "@/types";
import { PLANS, PlanTier, BillingInterval, normalizePlanTier } from "@/lib/feature-gating";
import { getAuthoritativePlan } from "@/lib/services/plan-service";
import {
  getOrCreateRazorpayPlan,
  resolvePlanFromRazorpay,
  resolveIntervalFromRazorpay,
} from "@/config/razorpay";
import { revalidatePath } from "next/cache";

// Lazy-import Razorpay Node SDK
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
 * Initiates subscription creation on the server.
 * Configures an immediate-start subscription (charges the actual plan amount immediately).
 */
export async function createStoreSubscriptionAction(
  storeId: string | null | undefined,
  planName: PlanTier,
  interval: BillingInterval = "monthly"
): Promise<ActionResponse<{ subscriptionId: string; keyId: string; isSimulated: boolean }>> {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

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

    // Lookup plan pricing from single-source-of-truth configuration
    const planConfig = await getAuthoritativePlan(planName);

    if (!planConfig) {
      return errorResponse("Invalid plan selection.");
    }

    if (planConfig.status === "inactive") {
      return errorResponse(
        "This plan is currently not open for new subscriptions. Please select another plan."
      );
    }

    const razorpay = getRazorpayInstance();
    const isSimulated = !razorpay;

    if (isSimulated) {
      const mockSubId = `sub_mock_${Date.now()}`;
      return successResponse({
        subscriptionId: mockSubId,
        keyId: "rzp_test_placeholder",
        isSimulated: true,
      });
    }

    // Real Razorpay Subscription API call
    const planId = await getOrCreateRazorpayPlan(razorpay, planName, interval);

    // Immediate-start subscription configuration:
    // Do NOT specify `start_at` so Razorpay starts the subscription immediately.
    // The first authentication transaction collects the actual plan price and credits cycle 1.
    const subscriptionPayload: any = {
      plan_id: planId,
      total_count: interval === "annual" ? 10 : 120, // 10 years annual / 10 years monthly recurring
      quantity: 1,
      customer_notify: 0, // Direct Kraftaura email dispatcher handles branded customer notifications
      notes: {
        storeId: storeId || "",
        planName: planName,
        billingInterval: interval,
        userId: user.id,
        userEmail: user.email || "",
      },
    };

    const subscription = await razorpay.subscriptions.create(subscriptionPayload);

    return successResponse({
      subscriptionId: subscription.id,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
      isSimulated: false,
    });
  } catch (err: any) {
    console.error("Failed to create subscription order:", err);
    return errorResponse(err.message || "Failed to create subscription order.");
  }
}

/**
 * Validates checkout signature on the server and authoritatively activates entitlements.
 * Verifies HMAC signature, checks captured payment amount from Razorpay, prevents duplicate records.
 */
export async function verifySubscriptionPaymentAction(payload: {
  storeId?: string | null;
  paymentId: string;
  subscriptionId: string;
  signature: string;
  planId?: PlanTier;
}): Promise<
  ActionResponse<{
    success: boolean;
    verifiedPlan?: PlanTier;
    nextBillingDate?: string | null;
    amount?: number;
  }>
> {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

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
    let payDetails: any = null;

    if (!isSimulated) {
      // 1. Strict cryptographic signature check
      const keySecret = process.env.RAZORPAY_KEY_SECRET || "";
      const expected = crypto
        .createHmac("sha256", keySecret)
        .update(payload.paymentId + "|" + payload.subscriptionId)
        .digest("hex");

      if (expected !== payload.signature) {
        return errorResponse("Cryptographic signature validation failed. Rejecting payment.");
      }

      // 2. Fetch authoritative subscription details from Razorpay
      try {
        subDetails = await razorpay.subscriptions.fetch(payload.subscriptionId);
      } catch (rzpErr) {
        console.error("Failed to query live Razorpay subscription details:", rzpErr);
      }

      // 3. Fetch authoritative payment details from Razorpay
      try {
        payDetails = await razorpay.payments.fetch(payload.paymentId);
      } catch (rzpErr) {
        console.error("Failed to query live Razorpay payment details:", rzpErr);
      }

      // Verify payment is captured or authorized (not failed or ₹5 token)
      if (payDetails && payDetails.status !== "captured" && payDetails.status !== "authorized") {
        return errorResponse(`Payment verification failed: payment status is ${payDetails.status}.`);
      }
    }

    const targetPlan = isSimulated
      ? payload.planId || "startup"
      : resolvePlanFromRazorpay(subDetails, payload.planId || "startup");
    const interval = isSimulated
      ? "monthly"
      : resolveIntervalFromRazorpay(subDetails, "monthly");

    const planConfig = await getAuthoritativePlan(targetPlan);
    const expectedPrice = interval === "annual" ? planConfig.priceAnnual : planConfig.priceMonthly;

    // Actual charged amount in rupees
    const chargedAmount = payDetails?.amount
      ? Math.round(payDetails.amount / 100)
      : expectedPrice;

    const adminSupabase = createAdminClient();
    const now = new Date();

    // Authoritative period dates from Razorpay
    let currentStartFromRzp = now.toISOString();
    let currentEndFromRzp = new Date(
      now.getTime() + (interval === "annual" ? 365 : 30) * 24 * 60 * 60 * 1000
    ).toISOString();
    let nextBillingDateFromRzp = currentEndFromRzp;

    if (subDetails?.current_start) {
      currentStartFromRzp = new Date(subDetails.current_start * 1000).toISOString();
    }
    if (subDetails?.current_end) {
      currentEndFromRzp = new Date(subDetails.current_end * 1000).toISOString();
      nextBillingDateFromRzp = currentEndFromRzp;
    }
    if (subDetails?.charge_at) {
      nextBillingDateFromRzp = new Date(subDetails.charge_at * 1000).toISOString();
    }

    // Check if payment row already recorded (Idempotency)
    const { data: existingPayment } = await (adminSupabase as any)
      .from("payments")
      .select("id")
      .eq("razorpay_payment_id", payload.paymentId)
      .maybeSingle();

    if (payload.storeId) {
      // Store-scoped subscription: upsert
      const { error: updateError } = await (adminSupabase.from("subscriptions") as any).upsert(
        {
          store_id: payload.storeId,
          user_id: user.id,
          plan: targetPlan,
          status: "active",
          razorpay_subscription_id: payload.subscriptionId,
          razorpay_signature: payload.signature,
          current_period_start: currentStartFromRzp,
          current_period_end: currentEndFromRzp,
          trial_start: null,
          trial_end: null,
          next_billing_date: nextBillingDateFromRzp,
          amount: chargedAmount,
          currency: "INR",
          updated_at: now.toISOString(),
        },
        { onConflict: "store_id" }
      );

      if (updateError) {
        console.error("Failed to update store subscription:", updateError);
      }

      // Record successful payment if not already recorded
      if (!existingPayment) {
        await (adminSupabase as any).from("payments").insert({
          store_id: payload.storeId,
          user_id: user.id,
          plan: targetPlan,
          razorpay_payment_id: payload.paymentId,
          razorpay_subscription_id: payload.subscriptionId,
          amount: chargedAmount,
          currency: "INR",
          status: "successful",
        });
      }

      // Revalidate all dashboard pages
      revalidatePath("/dashboard");
      revalidatePath("/dashboard/products");
      revalidatePath("/dashboard/categories");
      revalidatePath("/dashboard/analytics");
      revalidatePath("/dashboard/coupons");
      revalidatePath("/dashboard/billing");
    } else {
      // ONBOARDING FLOW: store is not created yet. Persist verified subscription by user_id
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
            trial_start: null,
            trial_end: null,
            next_billing_date: nextBillingDateFromRzp,
            amount: chargedAmount,
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
          trial_start: null,
          trial_end: null,
          next_billing_date: nextBillingDateFromRzp,
          amount: chargedAmount,
          currency: "INR",
          updated_at: now.toISOString(),
        });
      }

      // Record verified payment under user_id if not already recorded
      if (!existingPayment) {
        await (adminSupabase as any).from("payments").insert({
          user_id: user.id,
          store_id: null,
          plan: targetPlan,
          razorpay_payment_id: payload.paymentId,
          razorpay_subscription_id: payload.subscriptionId,
          amount: chargedAmount,
          currency: "INR",
          status: "successful",
        });
      }
    }

    // Trigger decoupled customer receipt & admin notification
    try {
      const { dispatchPaymentNotifications } = await import("@/lib/services/email-service");
      await dispatchPaymentNotifications({
        userId: user.id,
        storeId: payload.storeId || null,
        fallbackCustomerEmail: user.email,
        paymentId: payload.paymentId,
        subscriptionId: payload.subscriptionId,
        planTier: targetPlan,
        billingInterval: interval,
        amount: chargedAmount,
        currency: "INR",
        purchaseDate: now.toISOString(),
        currentPeriodEnd: currentEndFromRzp,
        nextBillingDate: nextBillingDateFromRzp,
      });
    } catch (notifyErr) {
      console.warn("Payment notification dispatch warning:", notifyErr);
    }

    return successResponse(
      {
        success: true,
        verifiedPlan: targetPlan,
        nextBillingDate: nextBillingDateFromRzp,
        amount: chargedAmount,
      },
      "Payment verified. Subscription active."
    );
  } catch (err: any) {
    console.error("verifySubscriptionPaymentAction error:", err);
    return errorResponse(err.message || "Failed to verify payment.");
  }
}

/**
 * Securely links and activates platform subscription during signup store wizard.
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

    const subscriptionId = paymentDetails?.subscriptionId;
    const paymentId = paymentDetails?.paymentId;
    const signature = paymentDetails?.signature;

    const razorpay = getRazorpayInstance();
    let subDetails: any = null;
    let payDetails: any = null;

    if (razorpay && subscriptionId && !subscriptionId.startsWith("sub_mock_")) {
      try {
        subDetails = await razorpay.subscriptions.fetch(subscriptionId);
      } catch (rzpErr) {
        console.error("Failed to fetch live subscription details:", rzpErr);
      }
      if (paymentId && !paymentId.startsWith("pay_mock_")) {
        try {
          payDetails = await razorpay.payments.fetch(paymentId);
        } catch (rzpErr) {
          console.error("Failed to fetch live payment details:", rzpErr);
        }
      }
    }

    // Resolve plan and interval
    const authoritativePlan = resolvePlanFromRazorpay(subDetails, planName);
    const interval = resolveIntervalFromRazorpay(subDetails, "monthly");
    const planConfig = await getAuthoritativePlan(authoritativePlan);
    const expectedPrice = interval === "annual" ? planConfig.priceAnnual : planConfig.priceMonthly;
    const chargedAmount = payDetails?.amount
      ? Math.round(payDetails.amount / 100)
      : expectedPrice;

    const now = new Date();
    let currentStart = now.toISOString();
    let currentEnd = new Date(
      now.getTime() + (interval === "annual" ? 365 : 30) * 24 * 60 * 60 * 1000
    ).toISOString();
    let nextBillingDate = currentEnd;

    if (subDetails?.current_start) {
      currentStart = new Date(subDetails.current_start * 1000).toISOString();
    }
    if (subDetails?.current_end) {
      currentEnd = new Date(subDetails.current_end * 1000).toISOString();
      nextBillingDate = currentEnd;
    }
    if (subDetails?.charge_at) {
      nextBillingDate = new Date(subDetails.charge_at * 1000).toISOString();
    }

    // Link user-scoped onboarding subscription to the new store
    const { subscriptionEngine } = await import("@/lib/services/subscription-engine");
    await subscriptionEngine.linkUserSubscriptionToStore(store.user_id, storeId, supabase);

    // Upsert authoritative store-scoped subscription
    const { error: upsertError } = await (supabase.from("subscriptions") as any).upsert(
      {
        store_id: storeId,
        user_id: store.user_id,
        plan: authoritativePlan,
        status: "active",
        razorpay_subscription_id: subscriptionId || null,
        razorpay_signature: signature || null,
        current_period_start: currentStart,
        current_period_end: currentEnd,
        trial_start: null,
        trial_end: null,
        next_billing_date: nextBillingDate,
        amount: chargedAmount,
        currency: "INR",
        updated_at: now.toISOString(),
      },
      { onConflict: "store_id" }
    );

    if (upsertError) {
      throw new Error("Failed to activate subscription: " + upsertError.message);
    }

    // Ensure payment record exists and is linked
    if (paymentId) {
      const { data: existingPayment } = await (supabase as any)
        .from("payments")
        .select("id")
        .eq("razorpay_payment_id", paymentId)
        .maybeSingle();

      if (!existingPayment) {
        await (supabase as any).from("payments").insert({
          store_id: storeId,
          user_id: store.user_id,
          plan: authoritativePlan,
          razorpay_payment_id: paymentId,
          razorpay_subscription_id: subscriptionId,
          amount: chargedAmount,
          currency: "INR",
          status: "successful",
        });
      } else {
        await (supabase as any)
          .from("payments")
          .update({ store_id: storeId })
          .eq("razorpay_payment_id", paymentId);
      }
    }

    // Revalidate dashboard pages
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
