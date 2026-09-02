import Razorpay from "razorpay";
import { PlanTier, PLANS, BillingInterval, normalizePlanTier } from "@/lib/feature-gating";
import { getAuthoritativePlan } from "@/lib/services/plan-service";

/**
 * Verified canonical Razorpay Plan mappings for Live Mode.
 */
export const CANONICAL_LIVE_PLANS: Record<PlanTier, Record<BillingInterval, string>> = {
  startup: {
    monthly: "plan_TX9IK58wPSNFyB", // ₹99 / month
    annual: "plan_TX9IKH4yPTcaJW",  // ₹990 / year
  },
  growth: {
    monthly: "plan_TX9IKeiNfzSh4C", // ₹299 / month
    annual: "plan_TX9IKqUhDOOm0d",  // ₹2,990 / year
  },
  pro: {
    monthly: "plan_TX9IL3qmI8sBYX", // ₹499 / month
    annual: "plan_TX9ILTPlWO2TxZ",  // ₹4,990 / year
  },
  premium_ai: {
    monthly: "plan_TX9ILgHaAswiSb", // ₹1,499 / month
    annual: "plan_TX9ILrJCuCEt2t",  // ₹14,990 / year
  },
};

/**
 * Verified canonical Razorpay Plan mappings for Test Mode.
 */
export const CANONICAL_TEST_PLANS: Record<PlanTier, Record<BillingInterval, string>> = {
  startup: {
    monthly: "plan_TWpn3FCsdzfD86", // ₹99 / month
    annual: "plan_TVy2QxIxImiUjL",  // ₹990 / year
  },
  growth: {
    monthly: "plan_TWpxWgDwFZ5yee", // ₹299 / month
    annual: "plan_TX8RsQ3wvAR4yZ",  // ₹2,990 / year
  },
  pro: {
    monthly: "plan_TWU0yX5bXHFj9k", // ₹499 / month
    annual: "plan_TX8oHpQOBCgZjA",  // ₹4,990 / year
  },
  premium_ai: {
    monthly: "plan_TWeD7qnlcuoqyZ", // ₹1,499 / month
    annual: "plan_TX8oI2BUTnHIi4",  // ₹14,990 / year
  },
};

export const getCanonicalPlans = (): Record<PlanTier, Record<BillingInterval, string>> => {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "";
  if (keyId.startsWith("rzp_live_")) {
    return CANONICAL_LIVE_PLANS;
  }
  return CANONICAL_TEST_PLANS;
};

export const CANONICAL_RAZORPAY_PLANS = getCanonicalPlans();

export const getOrCreateRazorpayPlan = async (
  razorpay: Razorpay,
  planTier: PlanTier,
  interval: BillingInterval = "monthly"
): Promise<string> => {
  const planConfig = await getAuthoritativePlan(planTier);
  const targetPrice = interval === "annual" ? planConfig.priceAnnual : planConfig.priceMonthly;
  const targetPaise = Math.round(targetPrice * 100);
  const targetPeriod = interval === "annual" ? "yearly" : "monthly";

  // 1. Check environment variable override
  const envKey = `RAZORPAY_PLAN_${planTier.toUpperCase()}_${interval.toUpperCase()}`;
  if (process.env[envKey]) {
    return process.env[envKey] as string;
  }

  // 2. Check canonical pre-configured plan mapping for active environment
  const canonicalPlans = getCanonicalPlans();
  const canonicalId = canonicalPlans[planTier]?.[interval];
  if (canonicalId) {
    return canonicalId;
  }

  // 3. Search existing plans in Razorpay to prevent creating duplicate plans
  try {
    const existingPlans = await razorpay.plans.all({ count: 100 });
    const match = existingPlans.items.find(
      (p: any) =>
        p.item.amount === targetPaise &&
        p.period === targetPeriod &&
        p.item.currency === "INR"
    );

    if (match) {
      return match.id;
    }

    // 4. Create plan if none exists
    const plan = await razorpay.plans.create({
      period: targetPeriod,
      interval: 1,
      item: {
        name: `Kraftaura ${planConfig.name} (${interval === "annual" ? "Annual" : "Monthly"})`,
        amount: targetPaise,
        currency: "INR",
        description: `Kraftaura ${interval} subscription tier: ${planConfig.name}`,
      },
    });
    return plan.id;
  } catch (error) {
    console.error("Failed to fetch or create plan in Razorpay:", error);
    return `plan_${planTier}_${interval}_mock`;
  }
};

/**
 * Authoritatively resolves the Kraftaura plan tier from a Razorpay subscription entity.
 * Checks notes, plan_id, and exact amount across both live and test registries.
 */
export const resolvePlanFromRazorpay = (
  subDetails: any,
  fallbackPlan: PlanTier = "startup"
): PlanTier => {
  if (!subDetails) return fallbackPlan;

  // 1. Check notes
  const notes = subDetails.notes || {};
  const planFromNotes = notes.planName || notes.plan_name || notes.plan || notes.planId;
  if (planFromNotes) {
    return normalizePlanTier(String(planFromNotes));
  }

  // 2. Check plan ID against both Live and Test canonical registries
  const planId = subDetails.plan_id;
  if (planId && typeof planId === "string") {
    for (const registry of [CANONICAL_LIVE_PLANS, CANONICAL_TEST_PLANS]) {
      for (const [tier, intervals] of Object.entries(registry)) {
        if (intervals.monthly === planId || intervals.annual === planId) {
          return tier as PlanTier;
        }
      }
    }

    const normalized = planId.toLowerCase();
    if (normalized.includes("premium") || normalized.includes("ai")) return "premium_ai";
    if (normalized.includes("pro")) return "pro";
    if (normalized.includes("growth") || normalized.includes("aura")) return "growth";
    if (normalized.includes("startup") || normalized.includes("starter")) return "startup";
  }

  // 3. Check item/plan amount (in paise or rupees)
  const itemAmount = subDetails.item?.amount || subDetails.plan?.item?.amount || subDetails.amount;
  if (typeof itemAmount === "number") {
    // Annual paise ranges
    if (itemAmount >= 1400000) return "premium_ai"; // 1499000
    if (itemAmount >= 450000) return "pro";          // 499000
    if (itemAmount >= 250000) return "growth";       // 299000
    if (itemAmount >= 90000 && itemAmount < 100000) return "startup"; // 99000 annual

    // Monthly paise ranges
    if (itemAmount >= 140000) return "premium_ai";   // 149900
    if (itemAmount >= 45000) return "pro";           // 49900
    if (itemAmount >= 25000) return "growth";        // 29900
    if (itemAmount >= 9000) return "startup";        // 9900

    // Direct rupee values
    if (itemAmount === 14990 || itemAmount === 1499) return "premium_ai";
    if (itemAmount === 4990 || itemAmount === 499) return "pro";
    if (itemAmount === 2990 || itemAmount === 299) return "growth";
    if (itemAmount === 990 || itemAmount === 99) return "startup";
  }

  return fallbackPlan;
};

/**
 * Authoritatively resolves the billing interval ("monthly" | "annual") from subscription details.
 */
export const resolveIntervalFromRazorpay = (
  subDetails: any,
  fallbackInterval: BillingInterval = "monthly"
): BillingInterval => {
  if (!subDetails) return fallbackInterval;

  const notes = subDetails.notes || {};
  const intervalFromNotes = notes.billingInterval || notes.interval;
  if (intervalFromNotes) {
    const norm = String(intervalFromNotes).toLowerCase();
    if (norm === "annual" || norm === "yearly") return "annual";
    if (norm === "monthly") return "monthly";
  }

  const period = subDetails.plan?.period || subDetails.period;
  if (period === "yearly") return "annual";
  if (period === "monthly") return "monthly";

  const planId = subDetails.plan_id;
  if (planId && typeof planId === "string") {
    for (const registry of [CANONICAL_LIVE_PLANS, CANONICAL_TEST_PLANS]) {
      for (const intervals of Object.values(registry)) {
        if (intervals.annual === planId) return "annual";
        if (intervals.monthly === planId) return "monthly";
      }
    }
  }

  const itemAmount = subDetails.item?.amount || subDetails.plan?.item?.amount || subDetails.amount;
  if (typeof itemAmount === "number") {
    if (itemAmount >= 90000 && itemAmount < 100000) return "annual"; // 99000 startup annual
    if (itemAmount >= 250000) return "annual"; // 299000, 499000, 1499000
    if (itemAmount === 990 || itemAmount === 2990 || itemAmount === 4990 || itemAmount === 14990) return "annual";
  }

  return fallbackInterval;
};
