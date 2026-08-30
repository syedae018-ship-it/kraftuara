import Razorpay from "razorpay";
import { PlanTier, PLANS, normalizePlanTier } from "@/lib/feature-gating";

export const getOrCreateRazorpayPlan = async (
  razorpay: Razorpay,
  planTier: PlanTier
): Promise<string> => {
  const planConfig = PLANS[planTier] || PLANS.startup;

  const envKey = `RAZORPAY_PLAN_${planTier.toUpperCase()}`;
  if (process.env[envKey]) {
    return process.env[envKey] as string;
  }

  try {
    const plan = await razorpay.plans.create({
      period: "monthly",
      interval: 1,
      item: {
        name: `Kraftaura ${planConfig.name}`,
        amount: planConfig.priceMonthly * 100, // Razorpay uses smallest currency sub-unit (paise)
        currency: "INR",
        description: `Kraftaura monthly subscription tier: ${planConfig.name}`,
      },
    });
    return plan.id;
  } catch (error) {
    console.error("Failed to create plan dynamically in Razorpay:", error);
    // Return a mock / placeholder plan format for sandbox fallback
    return `plan_${planTier}_mock`;
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
  if (planId) {
    if (process.env.RAZORPAY_PLAN_PREMIUM_AI && planId === process.env.RAZORPAY_PLAN_PREMIUM_AI) return "premium_ai";
    if (process.env.RAZORPAY_PLAN_PRO && planId === process.env.RAZORPAY_PLAN_PRO) return "pro";
    if (process.env.RAZORPAY_PLAN_GROWTH && planId === process.env.RAZORPAY_PLAN_GROWTH) return "growth";
    if (process.env.RAZORPAY_PLAN_STARTUP && planId === process.env.RAZORPAY_PLAN_STARTUP) return "startup";
    if (typeof planId === "string") {
      const normalized = planId.toLowerCase();
      if (normalized.includes("premium") || normalized.includes("ai")) return "premium_ai";
      if (normalized.includes("pro")) return "pro";
      if (normalized.includes("growth")) return "growth";
      if (normalized.includes("startup") || normalized.includes("starter")) return "startup";
    }
  }

  // 3. Check item/plan amount (in paise or rupees)
  const itemAmount = subDetails.item?.amount || subDetails.plan?.item?.amount || subDetails.amount;
  if (typeof itemAmount === "number") {
    if (itemAmount >= 149900 || itemAmount === 1499) return "premium_ai";
    if (itemAmount >= 49900 || itemAmount === 499) return "pro";
    if (itemAmount >= 29900 || itemAmount === 299) return "growth";
    if (itemAmount >= 9900 || itemAmount === 99) return "startup";
  }

  return fallbackPlan;
};
