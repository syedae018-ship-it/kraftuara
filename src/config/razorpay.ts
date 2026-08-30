import Razorpay from "razorpay";
import { PlanTier, PLANS, BillingInterval, normalizePlanTier } from "@/lib/feature-gating";
import { getAuthoritativePlan } from "@/lib/services/plan-service";

export const getOrCreateRazorpayPlan = async (
  razorpay: Razorpay,
  planTier: PlanTier,
  interval: BillingInterval = "monthly"
): Promise<string> => {
  const planConfig = await getAuthoritativePlan(planTier);
  const targetPrice = interval === "annual" ? planConfig.priceAnnual : planConfig.priceMonthly;

  const envKey = `RAZORPAY_PLAN_${planTier.toUpperCase()}_${interval.toUpperCase()}`;
  if (process.env[envKey]) {
    return process.env[envKey] as string;
  }

  try {
    const plan = await razorpay.plans.create({
      period: interval === "annual" ? "yearly" : "monthly",
      interval: 1,
      item: {
        name: `Kraftaura ${planConfig.name} (${interval === "annual" ? "Annual" : "Monthly"})`,
        amount: targetPrice * 100, // Razorpay uses smallest currency sub-unit (paise)
        currency: "INR",
        description: `Kraftaura ${interval} subscription tier: ${planConfig.name}`,
      },
    });
    return plan.id;
  } catch (error) {
    console.error("Failed to create plan dynamically in Razorpay:", error);
    // Return a mock / placeholder plan format for sandbox fallback
    return `plan_${planTier}_${interval}_mock`;
  }
};

/**
 * Authoritatively resolves the Kraftaura plan tier from a Razorpay subscription entity.
 * Checks notes, plan_id, and amount.
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

  // 2. Check plan ID from environment or ID string
  const planId = subDetails.plan_id;
  if (planId && typeof planId === "string") {
    const normalized = planId.toLowerCase();
    if (normalized.includes("premium") || normalized.includes("ai")) return "premium_ai";
    if (normalized.includes("pro")) return "pro";
    if (normalized.includes("growth")) return "growth";
    if (normalized.includes("startup") || normalized.includes("starter")) return "startup";
  }

  // 3. Check item/plan amount (in paise or rupees)
  const itemAmount = subDetails.item?.amount || subDetails.plan?.item?.amount || subDetails.amount;
  if (typeof itemAmount === "number") {
    // Annual paise ranges
    if (itemAmount >= 1400000) return "premium_ai";
    if (itemAmount >= 450000) return "pro";
    if (itemAmount >= 250000) return "growth";

    // Monthly paise ranges & Annual startup
    if (itemAmount >= 140000) return "premium_ai"; // ~149900
    if (itemAmount >= 90000) return "startup"; // ~99000 annual
    if (itemAmount >= 45000) return "pro"; // ~49900
    if (itemAmount >= 25000) return "growth"; // ~29900
    if (itemAmount >= 9000) return "startup"; // ~9900

    // Direct rupee values
    if (itemAmount === 14990 || itemAmount === 1499) return "premium_ai";
    if (itemAmount === 4990 || itemAmount === 499) return "pro";
    if (itemAmount === 2990 || itemAmount === 299) return "growth";
    if (itemAmount === 990 || itemAmount === 99) return "startup";
  }

  return fallbackPlan;
};
