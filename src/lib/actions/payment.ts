"use server";

import crypto from "crypto";
import { createServerSupabaseClient } from "@/lib/supabase/server";
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
  planName: "starter" | "pro" | "business"
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
        await (supabase.from("subscriptions") as any).upsert({
          store_id: storeId,
          plan: planName,
          status: "payment_pending",
          razorpay_subscription_id: mockSubId,
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });
      }

      return successResponse({
        subscriptionId: mockSubId,
        keyId: "rzp_test_placeholder",
        isSimulated: true,
      });
    }

    // Real Razorpay Subscription API call
    const planId = await getOrCreateRazorpayPlan(razorpay, planName);
    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      total_count: 12,
      quantity: 1,
      customer_notify: 1,
    });

    // If store ID exists, save pending subscription details in the DB
    if (storeId) {
      await (supabase.from("subscriptions") as any).upsert({
        store_id: storeId,
        plan: planName,
        status: "payment_pending",
        razorpay_subscription_id: subscription.id,
      });
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
 * Validates checkout signature on the server and activates entitlements
 */
export async function verifySubscriptionPaymentAction(payload: {
  storeId?: string | null;
  paymentId: string;
  subscriptionId: string;
  signature: string;
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

    const razorpay = getRazorpayInstance();
    const isSimulated = !razorpay || payload.subscriptionId.startsWith("sub_mock_");

    if (isSimulated) {
      if (payload.storeId) {
        const { data: currentSub } = await (supabase.from("subscriptions") as any)
          .select("plan")
          .eq("store_id", payload.storeId)
          .maybeSingle();

        const planName = currentSub?.plan || "starter";
        const planConfig = PLANS[planName as "starter" | "pro" | "business"];

        // Update subscription status to active
        await (supabase.from("subscriptions") as any).update({
          status: "active",
          razorpay_signature: payload.signature || "mock_signature",
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        }).eq("store_id", payload.storeId);

        // Log payment record
        await (supabase.from("payments") as any).insert({
          store_id: payload.storeId,
          plan: planName,
          razorpay_payment_id: payload.paymentId || `pay_mock_${Date.now()}`,
          razorpay_subscription_id: payload.subscriptionId,
          amount: planConfig?.priceMonthly || 0,
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
      const subDetails = await razorpay.subscriptions.fetch(payload.subscriptionId);
      
      const { data: currentSub } = await (supabase.from("subscriptions") as any)
        .select("plan")
        .eq("store_id", payload.storeId)
        .maybeSingle();

      const planName = currentSub?.plan || "starter";
      const planConfig = PLANS[planName as "starter" | "pro" | "business"];

      // Update DB Subscriptions
      await (supabase.from("subscriptions") as any).update({
        status: "active",
        razorpay_signature: payload.signature,
        current_period_start: new Date(subDetails.current_start * 1000).toISOString(),
        current_period_end: new Date(subDetails.current_end * 1000).toISOString(),
      }).eq("store_id", payload.storeId);

      // Insert successful payment record
      await (supabase.from("payments") as any).insert({
        store_id: payload.storeId,
        plan: planName,
        razorpay_payment_id: payload.paymentId,
        razorpay_subscription_id: payload.subscriptionId,
        amount: planConfig?.priceMonthly || 0,
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
