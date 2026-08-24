import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { PLANS } from "@/lib/feature-gating";

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

      // Find local subscription row linked to this Razorpay ID
      const { data: sub, error: fetchError } = await (supabase as any)
        .from("subscriptions")
        .select("store_id, plan, current_period_end, status")
        .eq("razorpay_subscription_id", subEntity.id)
        .maybeSingle();

      if (fetchError || !sub) {
        return NextResponse.json({ error: "Matching subscription record not found." }, { status: 404 });
      }

      const newPeriodEnd = new Date(subEntity.current_end * 1000).toISOString();
      const newPeriodStart = new Date(subEntity.current_start * 1000).toISOString();

      // Avoid race conditions: only update if period end is further out or status needs updating
      const isNewer = !sub.current_period_end || new Date(newPeriodEnd).getTime() > new Date(sub.current_period_end).getTime();

      if (isNewer || sub.status !== "active") {
        await (supabase as any)
          .from("subscriptions")
          .update({
            status: "active",
            current_period_start: newPeriodStart,
            current_period_end: newPeriodEnd,
          })
          .eq("razorpay_subscription_id", subEntity.id);
      }

      // Log payment record in payments table
      const planConfig = PLANS[sub.plan as "starter" | "pro" | "business"];
      const paymentEntity = payload.payment?.entity;

      await (supabase as any)
        .from("payments")
        .insert({
          store_id: sub.store_id,
          plan: sub.plan,
          razorpay_payment_id: paymentEntity?.id || `webhk_${eventId}`,
          razorpay_subscription_id: subEntity.id,
          amount: planConfig?.priceMonthly || 0,
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
