import Razorpay from "razorpay";

export const getOrCreateRazorpayPlan = async (
  razorpay: Razorpay,
  planTier: "startup" | "growth" | "pro"
): Promise<string> => {
  const activeDetails = {
    startup: { name: "Startup Pack", amount: 9900, period: "monthly" as const, interval: 1 },
    growth: { name: "Growth Pack", amount: 29900, period: "monthly" as const, interval: 1 },
    pro: { name: "Pro Plan", amount: 49900, period: "monthly" as const, interval: 1 },
  };

  const envKey = `RAZORPAY_PLAN_${planTier.toUpperCase()}`;
  if (process.env[envKey]) {
    return process.env[envKey] as string;
  }

  try {
    const details = activeDetails[planTier];
    const plan = await razorpay.plans.create({
      period: details.period,
      interval: details.interval,
      item: {
        name: `Kraftaura ${details.name}`,
        amount: details.amount,
        currency: "INR",
        description: `Kraftaura monthly subscription tier: ${planTier}`,
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
  fallbackPlan: "startup" | "growth" | "pro" = "startup"
): "startup" | "growth" | "pro" => {
  if (!subDetails) return fallbackPlan;

  // 1. Check notes
  const notes = subDetails.notes || {};
  const planFromNotes = notes.planName || notes.plan_name || notes.plan;
  if (planFromNotes) {
    const normalized = String(planFromNotes).toLowerCase().trim();
    if (normalized === "growth" || normalized.includes("growth")) return "growth";
    if (normalized === "pro" || normalized.includes("pro")) return "pro";
    if (normalized === "startup" || normalized.includes("startup") || normalized.includes("starter")) return "startup";
  }

  // 2. Check plan ID from environment or ID string
  const planId = subDetails.plan_id;
  if (planId) {
    if (process.env.RAZORPAY_PLAN_PRO && planId === process.env.RAZORPAY_PLAN_PRO) return "pro";
    if (process.env.RAZORPAY_PLAN_GROWTH && planId === process.env.RAZORPAY_PLAN_GROWTH) return "growth";
    if (process.env.RAZORPAY_PLAN_STARTUP && planId === process.env.RAZORPAY_PLAN_STARTUP) return "startup";
    if (typeof planId === "string") {
      if (planId.toLowerCase().includes("pro")) return "pro";
      if (planId.toLowerCase().includes("growth")) return "growth";
      if (planId.toLowerCase().includes("startup") || planId.toLowerCase().includes("starter")) return "startup";
    }
  }

  // 3. Check item/plan amount (in paise or rupees)
  const itemAmount = subDetails.item?.amount || subDetails.plan?.item?.amount || subDetails.amount;
  if (typeof itemAmount === "number") {
    if (itemAmount >= 49900 || itemAmount === 499) return "pro";
    if (itemAmount >= 29900 || itemAmount === 299) return "growth";
    if (itemAmount >= 9900 || itemAmount === 99) return "startup";
  }

  return fallbackPlan;
};

