/**
 * Plan Tiers & Feature Gating Engine
 */

export type PlanTier = "starter" | "pro" | "business";

export type FeatureKey =
  | "dashboard"
  | "products"
  | "categories"
  | "store_settings"
  | "appearance"
  | "whatsapp_orders"
  | "analytics"
  | "collections"
  | "premium_themes"
  | "creative_discounts"
  | "orders"
  | "payments"
  | "shipping"
  | "revenue_dashboard"
  | "coupons"
  | "inventory"
  | "custom_domain";

export interface PlanConfig {
  id: PlanTier;
  name: string;
  priceMonthly: number;
  description: string;
  allowedFeatures: FeatureKey[];
  productLimit: number;
  popular?: boolean;
}

export const PLANS: Record<PlanTier, PlanConfig> = {
  starter: {
    id: "starter",
    name: "Starter",
    priceMonthly: 99,
    description: "Perfect for new merchants & WhatsApp ordering stores.",
    allowedFeatures: [
      "dashboard",
      "products",
      "categories",
      "store_settings",
      "appearance",
      "whatsapp_orders",
    ],
    productLimit: 10,
  },
  pro: {
    id: "pro",
    name: "Growth",
    priceMonthly: 299,
    description: "Enhanced growth with Analytics, Collections & Premium Themes.",
    allowedFeatures: [
      "dashboard",
      "products",
      "categories",
      "store_settings",
      "appearance",
      "whatsapp_orders",
      "analytics",
      "collections",
      "premium_themes",
      "creative_discounts",
    ],
    productLimit: 12,
    popular: true,
  },
  business: {
    id: "business",
    name: "Pro / Business",
    priceMonthly: 499,
    description: "Complete E-commerce platform with Razorpay, Custom Domain & Advanced Features.",
    allowedFeatures: [
      "dashboard",
      "products",
      "categories",
      "store_settings",
      "appearance",
      "whatsapp_orders",
      "analytics",
      "collections",
      "premium_themes",
      "creative_discounts",
      "orders",
      "payments",
      "shipping",
      "revenue_dashboard",
      "coupons",
      "inventory",
      "custom_domain",
    ],
    productLimit: 100,
  },
};

/**
 * Utility to check if a plan tier has access to a specific feature key.
 */
export function hasFeatureAccess(planName: string, feature: FeatureKey): boolean {
  const normalized = planName.toLowerCase().replace(/[^a-z]/g, "");
  
  let tier: PlanTier = "starter";
  if (normalized.includes("business") || normalized.includes("enterprise")) tier = "business";
  else if (normalized.includes("pro") || normalized.includes("growth")) tier = "pro";
  else if (normalized.includes("starter") || normalized.includes("basic") || normalized.includes("free")) tier = "starter";

  const config = PLANS[tier];
  if (!config) return true;

  return config.allowedFeatures.includes(feature);
}

/**
 * Returns required plan for a given feature key.
 */
export function getRequiredPlanForFeature(feature: FeatureKey): PlanTier {
  if (PLANS.starter.allowedFeatures.includes(feature)) return "starter";
  if (PLANS.pro.allowedFeatures.includes(feature)) return "pro";
  return "business";
}
