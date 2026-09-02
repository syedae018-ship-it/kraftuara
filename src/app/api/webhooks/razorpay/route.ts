import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { PLANS } from "@/lib/feature-gating";
import { getAuthoritativePlan } from "@/lib/services/plan-service";
import {
  resolvePlanFromRazorpay,
  resolveIntervalFromRazorpay,
} from "@/config/razorpay";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature") || "";

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // Strict signature verification
    if (webhookSecret) {
      const expected = crypto
        .createHmac("sha256", webhookSecret)
        .update(rawBody)
        .digest("hex");

      if (expected !== signature) {
        return NextResponse.json(
          { error: "Cryptographic signature validation failed." },
          { status: 400 }
        );
      }
    }

    const body = JSON.parse(rawBody);
    const eventId = body.id;
    const eventType = body.event;

    if (!eventId || !eventType) {
      return NextResponse.json(
        { error: "Invalid webhook payload structure." },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Enforce idempotency on incoming webhook events
    const { error: insertError } = await (supabase as any)
      .from("razorpay_events")
      .insert({ id: eventId, event_type: eventType });

    if (insertError) {
      // Duplicate event (already processed) - acknowledge receipt to Razorpay
      return NextResponse.json({ success: true, message: "Duplicate event skipped." });
    }

    const payload = body.payload;

    // =========================================================================
    // 1. SUBSCRIPTION CHARGED (Initial charge & subsequent recurring renewals)
    // =========================================================================
    if (eventType === "subscription.charged") {
      const subEntity = payload.subscription?.entity;
      const paymentEntity = payload.payment?.entity;

      if (!subEntity) {
        return NextResponse.json({ error: "Subscription payload missing." }, { status: 400 });
      }

      const notes = subEntity.notes || {};
      const storeIdFromNotes = notes.storeId || notes.store_id;
      const userIdFromNotes = notes.userId || notes.user_id;

      // Find local subscription record
      let sub: any = null;

      // 1. By Razorpay subscription ID
      const { data: subByRzp } = await (supabase as any)
        .from("subscriptions")
        .select("id, store_id, user_id, plan, current_period_end, status")
        .eq("razorpay_subscription_id", subEntity.id)
        .maybeSingle();

      if (subByRzp) {
        sub = subByRzp;
      } else if (storeIdFromNotes) {
        const { data: subByStore } = await (supabase as any)
          .from("subscriptions")
          .select("id, store_id, user_id, plan, current_period_end, status")
          .eq("store_id", storeIdFromNotes)
          .maybeSingle();
        sub = subByStore;
      } else if (userIdFromNotes) {
        const { data: userStore } = await (supabase as any)
          .from("stores")
          .select("id")
          .eq("user_id", userIdFromNotes)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (userStore) {
          sub = {
            store_id: userStore.id,
            user_id: userIdFromNotes,
            plan: null,
            current_period_end: null,
            status: "payment_pending",
          };
        }
      }

      const targetPlan = resolvePlanFromRazorpay(subEntity, sub?.plan || "startup");
      const interval = resolveIntervalFromRazorpay(subEntity, "monthly");
      const planConfig = await getAuthoritativePlan(targetPlan);
      const expectedPrice = interval === "annual" ? planConfig.priceAnnual : planConfig.priceMonthly;

      // Actual captured payment amount
      const chargedAmount = paymentEntity?.amount
        ? Math.round(paymentEntity.amount / 100)
        : expectedPrice;

      const newPeriodStart = subEntity.current_start
        ? new Date(subEntity.current_start * 1000).toISOString()
        : new Date().toISOString();

      const newPeriodEnd = subEntity.current_end
        ? new Date(subEntity.current_end * 1000).toISOString()
        : new Date(Date.now() + (interval === "annual" ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString();

      const nextBillingDate = subEntity.charge_at
        ? new Date(subEntity.charge_at * 1000).toISOString()
        : newPeriodEnd;

      const effectivePaymentId = paymentEntity?.id || `pay_${eventId}`;

      // 1. Update/upsert subscription row
      if (sub?.store_id) {
        await (supabase as any).from("subscriptions").upsert(
          {
            store_id: sub.store_id,
            user_id: sub.user_id || userIdFromNotes || null,
            plan: targetPlan,
            status: "active",
            razorpay_subscription_id: subEntity.id,
            current_period_start: newPeriodStart,
            current_period_end: newPeriodEnd,
            trial_start: null,
            trial_end: null,
            next_billing_date: nextBillingDate,
            amount: chargedAmount,
            currency: "INR",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "store_id" }
        );
      } else if (userIdFromNotes) {
        const { data: existingUserSub } = await (supabase as any)
          .from("subscriptions")
          .select("id")
          .eq("user_id", userIdFromNotes)
          .is("store_id", null)
          .maybeSingle();

        if (existingUserSub) {
          await (supabase as any)
            .from("subscriptions")
            .update({
              plan: targetPlan,
              status: "active",
              razorpay_subscription_id: subEntity.id,
              current_period_start: newPeriodStart,
              current_period_end: newPeriodEnd,
              trial_start: null,
              trial_end: null,
              next_billing_date: nextBillingDate,
              amount: chargedAmount,
              currency: "INR",
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingUserSub.id);
        } else {
          await (supabase as any).from("subscriptions").insert({
            user_id: userIdFromNotes,
            store_id: null,
            plan: targetPlan,
            status: "active",
            razorpay_subscription_id: subEntity.id,
            current_period_start: newPeriodStart,
            current_period_end: newPeriodEnd,
            trial_start: null,
            trial_end: null,
            next_billing_date: nextBillingDate,
            amount: chargedAmount,
            currency: "INR",
            updated_at: new Date().toISOString(),
          });
        }

        // Also update profiles onboarding status
        await (supabase.from("profiles") as any)
          .update({
            onboarding_status: "payment_successful",
            updated_at: new Date().toISOString(),
          })
          .eq("id", userIdFromNotes);
      }

      // 2. Insert payment record idempotently
      if (paymentEntity?.id) {
        const { data: existingPayment } = await (supabase as any)
          .from("payments")
          .select("id")
          .eq("razorpay_payment_id", paymentEntity.id)
          .maybeSingle();

        if (!existingPayment) {
          await (supabase as any).from("payments").insert({
            store_id: sub?.store_id || null,
            user_id: sub?.user_id || userIdFromNotes || null,
            plan: targetPlan,
            razorpay_payment_id: paymentEntity.id,
            razorpay_subscription_id: subEntity.id,
            amount: chargedAmount,
            currency: "INR",
            status: "successful",
          });
        }
      }

      // 3. Dispatch customer notification
      try {
        const resolvedUserId = sub?.user_id || userIdFromNotes || null;
        const { dispatchPaymentNotifications } = await import("@/lib/services/email-service");
        await dispatchPaymentNotifications({
          userId: resolvedUserId,
          storeId: sub?.store_id || storeIdFromNotes || null,
          fallbackCustomerEmail:
            notes.userEmail || paymentEntity?.email || subEntity.customer_email || null,
          paymentId: effectivePaymentId,
          subscriptionId: subEntity.id,
          planTier: targetPlan,
          billingInterval: interval,
          amount: chargedAmount,
          currency: "INR",
          purchaseDate: new Date().toISOString(),
          currentPeriodEnd: newPeriodEnd,
          nextBillingDate: nextBillingDate,
        });
      } catch (notifyErr) {
        console.warn("Webhook payment notification warning:", notifyErr);
      }
    }

    // =========================================================================
    // 2. SUBSCRIPTION ACTIVATED / UPDATED
    // =========================================================================
    if (eventType === "subscription.activated" || eventType === "subscription.updated") {
      const subEntity = payload.subscription?.entity;
      if (subEntity?.id) {
        const targetPlan = resolvePlanFromRazorpay(subEntity);
        const interval = resolveIntervalFromRazorpay(subEntity, "monthly");
        const planConfig = await getAuthoritativePlan(targetPlan);
        const expectedPrice = interval === "annual" ? planConfig.priceAnnual : planConfig.priceMonthly;

        const updateData: any = {
          status: "active",
          updated_at: new Date().toISOString(),
        };

        if (subEntity.current_start) {
          updateData.current_period_start = new Date(subEntity.current_start * 1000).toISOString();
        }
        if (subEntity.current_end) {
          updateData.current_period_end = new Date(subEntity.current_end * 1000).toISOString();
          updateData.next_billing_date = updateData.current_period_end;
        }
        if (subEntity.charge_at) {
          updateData.next_billing_date = new Date(subEntity.charge_at * 1000).toISOString();
        }

        await (supabase as any)
          .from("subscriptions")
          .update(updateData)
          .eq("razorpay_subscription_id", subEntity.id);
      }
    }

    // =========================================================================
    // 3. SUBSCRIPTION AUTHENTICATED
    // =========================================================================
    if (eventType === "subscription.authenticated") {
      // Mandate authenticated. If immediate start, subscription.charged handles payment.
      // Do not create synthetic payment records.
      return NextResponse.json({ success: true, message: "Authentication confirmed." });
    }

    // =========================================================================
    // 4. SUBSCRIPTION PENDING (Scheduled charge retry in progress)
    // =========================================================================
    if (eventType === "subscription.pending") {
      const subEntity = payload.subscription?.entity;
      if (subEntity?.id) {
        await (supabase as any)
          .from("subscriptions")
          .update({
            status: "payment_pending",
            updated_at: new Date().toISOString(),
          })
          .eq("razorpay_subscription_id", subEntity.id);
      }
    }

    // =========================================================================
    // 5. SUBSCRIPTION HALTED (All renewal retry attempts exhausted)
    // =========================================================================
    if (eventType === "subscription.halted") {
      const subEntity = payload.subscription?.entity;
      if (subEntity?.id) {
        await (supabase as any)
          .from("subscriptions")
          .update({
            status: "halted",
            updated_at: new Date().toISOString(),
          })
          .eq("razorpay_subscription_id", subEntity.id);
      }
    }

    // =========================================================================
    // 6. SUBSCRIPTION RESUMED
    // =========================================================================
    if (eventType === "subscription.resumed") {
      const subEntity = payload.subscription?.entity;
      if (subEntity?.id) {
        await (supabase as any)
          .from("subscriptions")
          .update({
            status: "active",
            updated_at: new Date().toISOString(),
          })
          .eq("razorpay_subscription_id", subEntity.id);
      }
    }

    // =========================================================================
    // 7. SUBSCRIPTION CANCELLED OR COMPLETED
    // =========================================================================
    if (eventType === "subscription.cancelled") {
      const subEntity = payload.subscription?.entity;
      if (subEntity?.id) {
        await (supabase as any)
          .from("subscriptions")
          .update({
            status: "cancelled",
            updated_at: new Date().toISOString(),
          })
          .eq("razorpay_subscription_id", subEntity.id);
      }
    }

    if (eventType === "subscription.completed") {
      const subEntity = payload.subscription?.entity;
      if (subEntity?.id) {
        await (supabase as any)
          .from("subscriptions")
          .update({
            status: "expired",
            updated_at: new Date().toISOString(),
          })
          .eq("razorpay_subscription_id", subEntity.id);
      }
    }

    // =========================================================================
    // 8. PAYMENT FAILED
    // =========================================================================
    if (eventType === "payment.failed") {
      const paymentEntity = payload.payment?.entity;
      if (paymentEntity?.id) {
        // Record failed transaction audit entry
        const notes = paymentEntity.notes || {};
        const storeId = notes.storeId || notes.store_id || null;
        const userId = notes.userId || notes.user_id || null;
        const plan = notes.planName || notes.plan || "startup";

        const { data: existingPayment } = await (supabase as any)
          .from("payments")
          .select("id")
          .eq("razorpay_payment_id", paymentEntity.id)
          .maybeSingle();

        if (!existingPayment) {
          await (supabase as any).from("payments").insert({
            store_id: storeId,
            user_id: userId,
            plan: plan,
            razorpay_payment_id: paymentEntity.id,
            razorpay_subscription_id: paymentEntity.subscription_id || null,
            amount: Math.round((paymentEntity.amount || 0) / 100),
            currency: paymentEntity.currency || "INR",
            status: "failed",
          });
        }

        if (userId && !storeId) {
          await (supabase.from("profiles") as any)
            .update({
              onboarding_status: "payment_failed",
              updated_at: new Date().toISOString(),
            })
            .eq("id", userId);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Webhook processing error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
