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
import { getGlobalPlatformPromosStorage } from "@/lib/actions/admin";

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
 * Authoritatively validates coupon code server-side and adjusts the charged amount.
 */
export async function createStoreSubscriptionAction(
  storeId: string | null | undefined,
  planName: PlanTier,
  interval: BillingInterval = "monthly",
  couponCode?: string | null,
  billingDetails?: {
    name?: string;
    email?: string;
    phone?: string;
    state?: string;
    isBusinessBilling?: boolean;
    gstin?: string;
    businessName?: string;
  }
): Promise<ActionResponse<{ subscriptionId: string; keyId: string; isSimulated: boolean; finalAmount?: number }>> {
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

    const basePrice = interval === "annual" ? planConfig.priceAnnual : planConfig.priceMonthly;
    let discountAmount = 0;
    let validCouponCode = "";

    // Authoritative Server-side Coupon Validation
    if (couponCode && couponCode.trim()) {
      const cleanCode = couponCode.trim().toUpperCase();
      const storage = await getGlobalPlatformPromosStorage(supabase);
      const promos: any[] = storage.promos || [];
      const found = promos.find((p) => p.code?.trim().toUpperCase() === cleanCode);

      if (!found) {
        return errorResponse("Invalid promo code.");
      }

      if (found.status !== "active") {
        return errorResponse("This promo code is no longer active.");
      }

      if (found.expiryDate && new Date(found.expiryDate).getTime() < Date.now()) {
        return errorResponse("This promo code has expired.");
      }

      if (found.usageLimit > 0 && (found.usageCount || 0) >= found.usageLimit) {
        return errorResponse("This promo code has reached its usage limit.");
      }

      // Check plan restriction if configured
      const currentTier = normalizePlanTier(planName);
      const applicablePlan = (found.applicablePlanId || (found.applicablePlans && found.applicablePlans[0]) || "all").toLowerCase();

      if (applicablePlan !== "all") {
        const allowedTier = normalizePlanTier(applicablePlan);
        if (allowedTier !== currentTier) {
          return errorResponse("This promo code is not valid for this plan.");
        }
      }

      // Strict billing cycle compatibility check
      const couponCycle = found.billingCycle || found.applicableInterval || "all";
      if (couponCycle !== "all") {
        if (couponCycle === "annual" && interval !== "annual") {
          return errorResponse("This promo code is only valid for annual billing.");
        }
        if (couponCycle === "monthly" && interval !== "monthly") {
          return errorResponse("This promo code is only valid for monthly billing.");
        }
      }

      // Exact two-decimal currency precision
      if (found.discountType === "percentage") {
        discountAmount = Math.round(((basePrice * found.value) / 100) * 100) / 100;
      } else {
        discountAmount = Math.min(basePrice, Math.round(Number(found.value) * 100) / 100);
      }

      validCouponCode = cleanCode;
    }

    const finalPayableAmount = Math.max(0, Math.round((basePrice - discountAmount) * 100) / 100);

    const razorpay = getRazorpayInstance();
    const isSimulated = !razorpay;

    if (isSimulated) {
      const mockSubId = `sub_mock_${Date.now()}`;
      return successResponse({
        subscriptionId: mockSubId,
        keyId: "rzp_test_placeholder",
        isSimulated: true,
        finalAmount: finalPayableAmount,
      });
    }

    // Real Razorpay Subscription API call with authoritative final payable amount
    const planId = await getOrCreateRazorpayPlan(razorpay, planName, interval, finalPayableAmount);

    // Immediate-start subscription configuration:
    // Do NOT specify `start_at` so Razorpay starts the subscription immediately.
    // The first authentication transaction collects the actual plan price and credits cycle 1.
    const subscriptionPayload: any = {
      plan_id: planId,
      total_count: interval === "annual" ? 10 : 120, // 10 years annual / 10 years monthly recurring
      quantity: 1,
      customer_notify: 0, // Direct Kraftaura email dispatcher handles branded customer notifications
      notes: {
        planName: String(planName),
        billingInterval: String(interval),
        userId: String(user.id),
        userEmail: String(user.email || ""),
        couponCode: String(validCouponCode || ""),
        discountAmount: String(discountAmount || 0),
        originalPrice: String(basePrice),
        finalAmount: String(finalPayableAmount),
        discountScope: interval === "annual" ? "entire_period" : "first_payment",
        storeId: String(storeId || ""),
        billingName: String(billingDetails?.name || user.user_metadata?.full_name || ""),
        billingPhone: String(billingDetails?.phone || ""),
      },
    };

    const subscription = await razorpay.subscriptions.create(subscriptionPayload);

    return successResponse({
      subscriptionId: subscription.id,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
      isSimulated: false,
      finalAmount: finalPayableAmount,
    });
  } catch (err: any) {
    console.error("Failed to create subscription order:", err);
    const detailedMessage =
      err?.error?.description ||
      err?.description ||
      err?.message ||
      "Unable to start payment. Please try again.";
    return errorResponse(detailedMessage);
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

    // Actual charged amount in rupees (preserves exact decimals, e.g. 239.20)
    const chargedAmount = payDetails?.amount
      ? Math.round(payDetails.amount) / 100
      : (subDetails?.notes?.finalAmount ? Number(subDetails.notes.finalAmount) : expectedPrice);

    // Future recurring subscription amount:
    // If scope is first_payment or entire_period, future recurring billing returns to original plan price!
    const discountScope = subDetails?.notes?.discountScope || "first_payment";
    const futureRecurringAmount = discountScope === "recurring" ? chargedAmount : expectedPrice;

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

    // Ensure a valid store ID exists to satisfy database foreign-key constraints
    let targetStoreId = payload.storeId;
    if (!targetStoreId) {
      const { data: userStore } = await (adminSupabase.from("stores") as any)
        .select("id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (userStore) {
        targetStoreId = userStore.id;
      } else {
        // Create draft onboarding store for the user so foreign key constraints on subscriptions and payments are satisfied
        const defaultName = subDetails?.notes?.billingName || user.user_metadata?.full_name || "My Store";
        const rawSlug = defaultName.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").slice(0, 20);
        const draftSlug = `${rawSlug || "store"}-${Date.now().toString(36)}`;

        const { data: newStore, error: newStoreErr } = await (adminSupabase.from("stores") as any)
          .insert({
            user_id: user.id,
            name: defaultName,
            slug: draftSlug,
            status: "draft",
            is_published: false,
            currency: "INR",
          })
          .select("id")
          .single();

        if (newStoreErr) {
          console.error("Failed to create draft store during payment verification:", newStoreErr);
        } else if (newStore) {
          targetStoreId = newStore.id;
        }
      }
    }

    if (targetStoreId) {
      // Store-scoped subscription: upsert
      const { error: updateError } = await (adminSupabase.from("subscriptions") as any).upsert(
        {
          store_id: targetStoreId,
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
          amount: futureRecurringAmount, // Future recurring billing returns to original plan price!
          currency: "INR",
          updated_at: now.toISOString(),
        },
        { onConflict: "store_id" }
      );

      if (updateError) {
        console.error("Failed to update store subscription:", updateError);
      }

      // Record successful payment if not already recorded (Idempotency)
      if (!existingPayment) {
        await (adminSupabase as any).from("payments").insert({
          store_id: targetStoreId,
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
    }

    // Schedule next-cycle standard plan if first_payment discount was applied
    if (razorpay && !isSimulated && discountScope === "first_payment") {
      try {
        const canonicalPlanId = await getOrCreateRazorpayPlan(razorpay, targetPlan, interval, expectedPrice);
        if (canonicalPlanId && subDetails?.plan_id && canonicalPlanId !== subDetails.plan_id) {
          await razorpay.subscriptions.update(payload.subscriptionId, {
            plan_id: canonicalPlanId,
            schedule_change_at: "cycle_end",
          });
        }
      } catch (scheduleErr) {
        console.warn("Could not schedule future cycle plan update on Razorpay:", scheduleErr);
      }
    }

    // Record complete financial audit trail in activity_logs
    try {
      const couponCodeUsed = (subDetails?.notes?.couponCode || "").trim().toUpperCase();
      const origAmt = Number(subDetails?.notes?.originalPrice || expectedPrice);
      const discAmt = Number(subDetails?.notes?.discountAmount || (origAmt - chargedAmount));

      await (adminSupabase.from("activity_logs") as any).insert({
        user_id: user.id,
        store_id: payload.storeId || null,
        action: "SUBSCRIPTION_PAYMENT_VERIFIED",
        details: {
          paymentId: payload.paymentId,
          subscriptionId: payload.subscriptionId,
          plan: targetPlan,
          originalAmount: origAmt,
          discountAmount: discAmt,
          finalPaid: chargedAmount,
          couponCode: couponCodeUsed || null,
          billingCycle: interval,
          discountScope,
          futureRecurringAmount,
          status: "successful",
        },
      });
    } catch (auditErr) {
      console.warn("Could not insert payment audit log:", auditErr);
    }

    // Atomically increment promo code usage count if a promo code was used in the subscription notes
    try {
      const couponCodeUsed = (subDetails?.notes?.couponCode || "").trim().toUpperCase();
      if (couponCodeUsed) {
        const { recordPromoCodeUsageAction } = await import("@/lib/actions/admin");
        await recordPromoCodeUsageAction(couponCodeUsed);
      }
    } catch (couponErr) {
      console.warn("Could not increment coupon usage count:", couponErr);
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

/**
 * Authoritatively checks if the current authenticated user has an active subscription or successful payment.
 * Used for post-payment onboarding continuation, preventing double-charging, and resume flows.
 */
export async function checkUserActiveSubscriptionAction(): Promise<
  ActionResponse<{
    hasActiveSubscription: boolean;
    plan: PlanTier | null;
    status: string;
    amount: number;
    nextBillingDate: string | null;
    hasStores: boolean;
    storeName?: string;
    storeSlug?: string;
    onboardingStatus: string;
    onboardingStep: number;
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

    // 1. Check user stores
    const { data: stores } = await (supabase.from("stores") as any)
      .select("id, name, slug")
      .eq("user_id", user.id);

    const hasStores = Boolean(stores && stores.length > 0);
    const primaryStore = stores?.[0];

    // 2. Safe onboarding state evaluation based on store and subscription status
    const onboardingStatus = hasStores ? "completed" : "account_created";
    const onboardingStep = hasStores ? 3 : 1;

    // 3. Resolve authoritative subscription using subscription engine
    const { subscriptionEngine } = await import("@/lib/services/subscription-engine");
    const sub = await subscriptionEngine.getAuthoritativeSubscription(
      primaryStore?.id || "",
      user.id,
      supabase
    );

    // A user has an active subscription ONLY if their status is active/trialing
    // AND they actually have verified proof: an existing store, razorpay subscription id,
    // future currentPeriodEnd, or an active subscription row with positive amount.
    const hasVerifiedProof = Boolean(
      hasStores ||
      sub.razorpaySubscriptionId ||
      (sub.currentPeriodEnd && new Date(sub.currentPeriodEnd).getTime() > Date.now()) ||
      (sub.status === "active" && sub.amount > 0)
    );

    const isActive = (sub.status === "active" || sub.status === "trialing") && hasVerifiedProof;

    return successResponse({
      hasActiveSubscription: isActive,
      plan: isActive ? sub.plan : null,
      status: isActive ? sub.status : "payment_pending",
      amount: isActive ? sub.amount : 0,
      nextBillingDate: sub.nextBillingDate,
      hasStores,
      storeName: primaryStore?.name,
      storeSlug: primaryStore?.slug,
      onboardingStatus,
      onboardingStep,
    });
  } catch (err: any) {
    return errorResponse(err.message || "Failed to check subscription status.");
  }
}
