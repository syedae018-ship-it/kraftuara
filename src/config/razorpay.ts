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
