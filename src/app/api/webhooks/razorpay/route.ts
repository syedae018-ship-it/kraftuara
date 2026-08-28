import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { PLANS } from "@/lib/feature-gating";
import { resolvePlanFromRazorpay } from "@/config/razorpay";

// Force NextJS to treat this as dynamic route (without caching)
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature") || "";

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    
    // If webhook secret is configured, strictly verify signature
    if (webhookSecret) {
      const expected = crypto
        .createHmac("sha256", webhookSecret)
        .update(rawBody)
        .digest("hex");

      if (expected !== signature) {
        return NextResponse.json({ error: "Cryptographic signature validation failed." }, { status: 400 });
      }
    }

    const body = JSON.parse(rawBody);
    const eventId = body.id;
    const eventType = body.event;

    if (!eventId || !eventType) {
      return NextResponse.json({ error: "Invalid webhook payload structure." }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Enforce idempotency: insert event log
    const { error: insertError } = await (supabase as any)
      .from("razorpay_events")
      .insert({ id: eventId, event_type: eventType });

    if (insertError) {
      // Duplicate event (already processed) - return 200 to acknowledge receipt to Razorpay
      return NextResponse.json({ success: true, message: "Duplicate event skipped." });
    }

    const payload = body.payload;

    if (eventType === "subscription.activated" || eventType === "subscription.charged") {
      const subEntity = payload.subscription?.entity;
      if (!subEntity) {
        return NextResponse.json({ error: "Subscription payload missing." }, { status: 400 });
      }

      const notes = subEntity.notes || {};
      const storeIdFromNotes = notes.storeId || notes.store_id;
      const userIdFromNotes = notes.userId || notes.user_id;

      let sub = null;
      let fetchError = null;

      // 1. Try to find local subscription row by Razorpay subscription ID
      const { data: subByRzp, error: fetchErr } = await (supabase as any)
        .from("subscriptions")
        .select("store_id, plan, current_period_end, status")
        .eq("razorpay_subscription_id", subEntity.id)
        .maybeSingle();

      if (fetchErr) {
        fetchError = fetchErr;
      }

      if (subByRzp) {
        sub = subByRzp;
      } else if (storeIdFromNotes) {
        // 2. Fallback to notes storeId
        const { data: subByStore } = await (supabase as any)
          .from("subscriptions")
          .select("store_id, plan, current_period_end, status")
          .eq("store_id", storeIdFromNotes)
          .maybeSingle();
        sub = subByStore;
      } else if (userIdFromNotes) {
        // 3. Fallback to user's latest store (handles onboarding race condition)
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
            plan: null,
            current_period_end: null,
            status: "payment_pending",
          };
        }
      }

      if (fetchError || !sub) {
        // If store is still not created, log and return 200 so Razorpay does not endlessly retry
        console.warn(`Webhook received for subscription ${subEntity.id}, but no linked store yet.`);
        return NextResponse.json({ success: true, message: "Subscription acknowledged, waiting for store link." });
      }

      const targetPlan = resolvePlanFromRazorpay(subEntity, (sub.plan as any) || "startup");
      const planConfig = PLANS[targetPlan] || PLANS.startup;
      const amount = planConfig.priceMonthly;

      const newPeriodEnd = new Date(subEntity.current_end * 1000).toISOString();
      const newPeriodStart = new Date(subEntity.current_start * 1000).toISOString();

      // Avoid race conditions: only update if period end is further out, status needs updating, or plan needs updating
      const isNewer = !sub.current_period_end || new Date(newPeriodEnd).getTime() > new Date(sub.current_period_end).getTime();

      const trialStart = subEntity.created_at ? new Date(subEntity.created_at * 1000).toISOString() : new Date().toISOString();
      const trialEnd = subEntity.start_at ? new Date(subEntity.start_at * 1000).toISOString() : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

      if (isNewer || sub.status !== "active" || sub.plan !== targetPlan) {
        await (supabase as any)
          .from("subscriptions")
          .update({
            plan: targetPlan,
            status: "active",
            razorpay_subscription_id: subEntity.id,
            current_period_start: newPeriodStart,
            current_period_end: newPeriodEnd,
            trial_start: trialStart,
            trial_end: trialEnd,
            next_billing_date: newPeriodEnd,
            amount: amount,
            currency: "INR",
            updated_at: new Date().toISOString(),
          })
          .eq("store_id", sub.store_id);
      }

      // Log payment record in payments table
      const paymentEntity = payload.payment?.entity;

      await (supabase as any)
        .from("payments")
        .insert({
          store_id: sub.store_id,
          plan: targetPlan,
          razorpay_payment_id: paymentEntity?.id || `webhk_${eventId}`,
          razorpay_subscription_id: subEntity.id,
          amount: amount,
          currency: "INR",
          status: "successful",
        });
    }

    if (eventType === "subscription.cancelled" || eventType === "subscription.completed") {
      const subEntity = payload.subscription?.entity;
      if (!subEntity) {
        return NextResponse.json({ error: "Subscription payload missing." }, { status: 400 });
      }

      await (supabase as any)
        .from("subscriptions")
        .update({
          status: "cancelled",
        })
        .eq("razorpay_subscription_id", subEntity.id);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Webhook processing error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
