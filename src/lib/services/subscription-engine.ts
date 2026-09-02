import { createClient } from "@/lib/supabase/client";
import { normalizePlanTier, PLANS, PlanTier, FeatureKey, hasFeatureAccess, getProductLimit } from "@/lib/feature-gating";

export interface AuthoritativeSubscription {
  storeId: string;
  userId: string | null;
  plan: PlanTier;
  status: "active" | "trialing" | "expired" | "cancelled" | "pending" | "payment_pending" | "halted";
  amount: number;
  currency: string;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  trialStart: string | null;
  trialEnd: string | null;
  nextBillingDate: string | null;
  razorpaySubscriptionId: string | null;
  daysRemaining: number | null;
  isTrial: boolean;
}

class SubscriptionEngine {
  private getSupabase(client?: any) {
    if (typeof window === "undefined") {
      try {
        const { createAdminClient } = require("@/lib/supabase/admin");
        return createAdminClient();
      } catch {
        if (client) return client;
        return createClient();
      }
    }
    if (client) return client;
    return createClient();
  }

  /**
   * Resolves the authoritative active subscription and plan for a store or user.
   * Follows strict hierarchy:
   * 1. Active row in `subscriptions` table matching store_id.
   * 2. If no store subscription, checks verified active subscription for user_id.
   * 3. Fallback: Checks verified successful payments in `payments` table.
   * 4. Fallback: Checks plan column in `stores` table.
   * 5. Default: Canonical "startup" (Starter Pack) tier.
   */
  async getAuthoritativeSubscription(
    storeId: string,
    userId?: string | null,
    client?: any
  ): Promise<AuthoritativeSubscription> {
    const supabase = this.getSupabase(client);
    const now = new Date();

    let subRow: any = null;

    // 1. Check store-scoped subscription
    if (storeId) {
      const { data: storeSub } = await (supabase.from("subscriptions") as any)
        .select("*")
        .eq("store_id", storeId)
        .maybeSingle();

      if (storeSub) {
        subRow = storeSub;
      }
    }

    // 2. If not found by store_id and user_id is provided, check user-scoped subscription
    if (!subRow && userId) {
      const { data: userSub } = await (supabase.from("subscriptions") as any)
        .select("*")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (userSub) {
        subRow = userSub;
      }
    }

    // 3. Fallback: check recent successful payment
    let recoveredPaymentPlan: PlanTier | null = null;
    let recoveredAmount = 99;
    let recoveredRzpSubId: string | null = null;

    if (!subRow || subRow.status === "payment_pending" || subRow.status === "pending") {
      try {
        let paymentQuery = (supabase.from("payments") as any)
          .select("plan, amount, razorpay_subscription_id, created_at")
          .eq("status", "successful")
          .order("created_at", { ascending: false })
          .limit(1);

        if (storeId) {
          paymentQuery = paymentQuery.eq("store_id", storeId);
        } else if (userId) {
          paymentQuery = paymentQuery.eq("user_id", userId);
        }

        const { data: latestPayment } = await paymentQuery.maybeSingle();

        if (latestPayment?.plan) {
          recoveredPaymentPlan = normalizePlanTier(latestPayment.plan);
          recoveredAmount = latestPayment.amount || (PLANS[recoveredPaymentPlan]?.priceMonthly ?? 99);
          recoveredRzpSubId = latestPayment.razorpay_subscription_id || null;
        }
      } catch (err) {
        console.error("Payment fallback resolution error:", err);
      }
    }

    // If we recovered a verified paid plan from payments and the sub row was missing or pending, promote it
    if (recoveredPaymentPlan && (!subRow || subRow.status === "payment_pending" || subRow.status === "pending")) {
      const planConfig = PLANS[recoveredPaymentPlan] || PLANS.startup;
      const trialEndStr = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

      if (storeId) {
        const { data: upsertedSub } = await (supabase.from("subscriptions") as any)
          .upsert({
            store_id: storeId,
            user_id: userId || subRow?.user_id || null,
            plan: recoveredPaymentPlan,
            status: "active",
            razorpay_subscription_id: recoveredRzpSubId || subRow?.razorpay_subscription_id || null,
            current_period_start: now.toISOString(),
            current_period_end: trialEndStr,
            amount: recoveredAmount,
            currency: "INR",
            updated_at: now.toISOString(),
          }, { onConflict: "store_id" })
          .select()
          .maybeSingle();

        if (upsertedSub) {
          subRow = upsertedSub;
        }
      }
    }

    // Default base structure
    let canonicalPlan: PlanTier = "startup";
    let status: AuthoritativeSubscription["status"] = "active";
    let amount = PLANS.startup.priceMonthly;
    let currency = "INR";
    let currentPeriodStart: string | null = null;
    let currentPeriodEnd: string | null = null;
    let trialStart: string | null = null;
    let trialEnd: string | null = null;
    let nextBillingDate: string | null = null;
    let razorpaySubscriptionId: string | null = null;
    let daysRemaining: number | null = null;

    if (subRow) {
      canonicalPlan = normalizePlanTier(subRow.plan);
      amount = subRow.amount || (PLANS[canonicalPlan]?.priceMonthly ?? 99);
      currency = subRow.currency || "INR";
      currentPeriodStart = subRow.current_period_start;
      currentPeriodEnd = subRow.current_period_end;
      trialStart = subRow.trial_start;
      trialEnd = subRow.trial_end;
      nextBillingDate = subRow.next_billing_date;
      razorpaySubscriptionId = subRow.razorpay_subscription_id;

      // Status Evaluation
      const rawStatus = (subRow.status || "").toLowerCase();
      if (rawStatus === "active" || rawStatus === "authenticated" || rawStatus === "trialing") {
        status = rawStatus === "trialing" ? "trialing" : "active";
      } else if (rawStatus === "cancelled") {
        status = "cancelled";
      } else if (rawStatus === "expired") {
        status = "expired";
      } else if (rawStatus === "halted") {
        status = "halted";
      } else if (rawStatus === "pending" || rawStatus === "payment_pending") {
        status = "payment_pending";
      } else {
        status = "active";
      }

      // Check Expiry Date
      if (currentPeriodEnd) {
        const expiryDate = new Date(currentPeriodEnd);
        const diffMs = expiryDate.getTime() - now.getTime();
        daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

        if (diffMs < 0 && (status === "active" || status === "trialing" || status === "payment_pending")) {
          status = "expired";
        }
      }
    }

    // Downgrade resolved runtime plan to startup only if genuinely expired or cancelled/halted with expired period
    const isExpired = daysRemaining !== null ? daysRemaining <= 0 : false;
    if (status === "expired" || ((status === "cancelled" || status === "halted") && isExpired)) {
      canonicalPlan = "startup";
    } else if (!subRow && recoveredPaymentPlan) {
      canonicalPlan = recoveredPaymentPlan;
    } else if (!subRow && storeId) {
      try {
        const { data: stRow } = await (supabase.from("stores") as any)
          .select("plan, status")
          .eq("id", storeId)
          .maybeSingle();
        if (stRow?.plan && stRow.status !== "suspended") {
          canonicalPlan = normalizePlanTier(stRow.plan);
        }
      } catch {
        // ignore
      }
    }

    const isTrial = !!(trialEnd && new Date(trialEnd).getTime() > now.getTime());


    return {
      storeId,
      userId: userId || subRow?.user_id || null,
      plan: canonicalPlan,
      status,
      amount,
      currency,
      currentPeriodStart,
      currentPeriodEnd,
      trialStart,
      trialEnd,
      nextBillingDate,
      razorpaySubscriptionId,
      daysRemaining,
      isTrial,
    };
  }

  /**
   * Returns product limit for a store based on its authoritative active subscription.
   */
  async getStoreProductLimit(storeId: string, client?: any): Promise<number> {
    const sub = await this.getAuthoritativeSubscription(storeId, null, client);
    return getProductLimit(sub.plan);
  }

  /**
   * Checks feature access for a store based on its authoritative active subscription.
   */
  async hasStoreFeatureAccess(storeId: string, featureKey: FeatureKey, client?: any): Promise<boolean> {
    const sub = await this.getAuthoritativeSubscription(storeId, null, client);
    return hasFeatureAccess(sub.plan, featureKey);
  }

  /**
   * Links any verified unlinked subscription belonging to a user to a newly created store.
   */
  async linkUserSubscriptionToStore(userId: string, storeId: string, client?: any): Promise<AuthoritativeSubscription> {
    const supabase = this.getSupabase(client);
    const now = new Date();

    // Find any user subscription (including one without store_id or unlinked)
    const { data: userSub } = await (supabase.from("subscriptions") as any)
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (userSub && (!userSub.store_id || userSub.store_id !== storeId)) {
      const canonicalPlan = normalizePlanTier(userSub.plan);
      const planConfig = PLANS[canonicalPlan] || PLANS.startup;

      await (supabase.from("subscriptions") as any)
        .upsert({
          store_id: storeId,
          user_id: userId,
          plan: canonicalPlan,
          status: userSub.status || "active",
          razorpay_subscription_id: userSub.razorpay_subscription_id,
          razorpay_signature: userSub.razorpay_signature,
          current_period_start: userSub.current_period_start || now.toISOString(),
          current_period_end: userSub.current_period_end || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          trial_start: null,
          trial_end: null,
          next_billing_date: userSub.next_billing_date || userSub.current_period_end,
          amount: userSub.amount || planConfig.priceMonthly,
          currency: "INR",
          updated_at: now.toISOString(),
        }, { onConflict: "store_id" });

      // Also link any unlinked payment records
      await (supabase.from("payments") as any)
        .update({ store_id: storeId })
        .eq("user_id", userId)
        .is("store_id", null);
    }

    return this.getAuthoritativeSubscription(storeId, userId, supabase);
  }
}

export const subscriptionEngine = new SubscriptionEngine();
