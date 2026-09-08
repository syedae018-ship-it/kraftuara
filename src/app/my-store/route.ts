import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { subscriptionEngine } from "@/lib/services/subscription-engine";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const adminClient = createAdminClient();
    const { data: stores } = await adminClient
      .from("stores")
      .select("id, slug, is_published, status")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (stores && stores.length > 0) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // No stores exist. Check if user has an active verified subscription
    const sub = await subscriptionEngine.getAuthoritativeSubscription(null, user.id);
    if (sub && sub.status === "active" && sub.plan) {
      // User with verified active subscription who hasn't completed store setup
      return NextResponse.redirect(new URL("/create-store", request.url));
    }

    // Brand-new unpaid user -> Route to Choose Plan
    return NextResponse.redirect(new URL("/choose-plan", request.url));
  } catch (error) {
    console.error("Error handling /my-store redirect:", error);
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
}
