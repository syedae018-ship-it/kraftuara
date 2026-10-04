import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { subscriptionEngine } from "@/lib/services/subscription-engine";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    // STATE 1: Unauthenticated -> Login / Signup
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const adminClient = createAdminClient();

    // 1. Check existing stores
    const { data: stores } = await adminClient
      .from("stores")
      .select("id, slug, is_published, status")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    // STATE 6: Authenticated + Store Exists -> My Store (Dashboard)
    if (stores && stores.length > 0) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // 2. No stores exist. Check authoritative subscription and payment records
    const sub = await subscriptionEngine.getAuthoritativeSubscription(null, user.id);

    const { data: paymentRecord } = await adminClient
      .from("payments")
      .select("id, status")
      .eq("user_id", user.id)
      .eq("status", "successful")
      .limit(1)
      .maybeSingle();

    const hasVerifiedProof = Boolean(
      sub.razorpaySubscriptionId ||
      (sub.currentPeriodEnd && new Date(sub.currentPeriodEnd).getTime() > Date.now()) ||
      paymentRecord
    );

    // STATE 5: Authenticated + Payment Verified + Store Not Created -> Store Setup
    if ((sub.status === "active" || sub.status === "trialing") && hasVerifiedProof) {
      return NextResponse.redirect(new URL("/create-store", request.url));
    }

    // STATE 7: Authenticated + Subscription Expired -> Renewal / Plans
    if (
      sub.status === "expired" ||
      (sub.currentPeriodEnd && new Date(sub.currentPeriodEnd).getTime() <= Date.now() && sub.status !== "active")
    ) {
      return NextResponse.redirect(new URL("/choose-plan?status=expired", request.url));
    }

    // STATE 2: Authenticated + No Plan -> Plans
    return NextResponse.redirect(new URL("/choose-plan", request.url));
  } catch (error) {
    console.error("Error handling /my-store redirect:", error);
    return NextResponse.redirect(new URL("/login", request.url));
  }
}
