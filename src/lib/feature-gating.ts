/**
 * Plan Tiers & Feature Gating Engine
 */

export type PlanTier = "free" | "starter" | "pro" | "business";

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
  free: {
    id: "free",
    name: "Free Demo",
    priceMonthly: 0,
    description: "Ideal for testing features and creating demo catalogs.",
    allowedFeatures: ["dashboard", "products", "categories", "appearance"],
    productLimit: 5,
  },
  starter: {
    id: "starter",
    name: "Starter Plan",
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
    productLimit: 50,
  },
  pro: {
    id: "pro",
    name: "Pro Plan",
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
    productLimit: 500,
    popular: true,
  },
  business: {
    id: "business",
    name: "Business Suite",
    priceMonthly: 499,
    description: "Complete E-commerce platform with Razorpay, Shipping & Inventory.",
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
    productLimit: 5000,
  },
};

/**
 * Utility to check if a plan tier has access to a specific feature key.
 */
export function hasFeatureAccess(planName: string, feature: FeatureKey): boolean {
  const normalized = planName.toLowerCase().replace(/[^a-z]/g, "");
  
  let tier: PlanTier = "starter";
  if (normalized.includes("free")) tier = "free";
  else if (normalized.includes("business") || normalized.includes("enterprise")) tier = "business";
  else if (normalized.includes("pro")) tier = "pro";
  else if (normalized.includes("starter") || normalized.includes("basic")) tier = "starter";

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
