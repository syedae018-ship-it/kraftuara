/**
 * Plan Tiers & Feature Gating Engine
 */

export type PlanTier = "startup" | "growth" | "pro";

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
  categoryLimit: number;
  popular?: boolean;
}

export const PLANS: Record<PlanTier, PlanConfig> = {
  startup: {
    id: "startup",
    name: "Startup Pack",
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
    productLimit: 12,
    categoryLimit: 1,
  },
  growth: {
    id: "growth",
    name: "Growth Pack",
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
    productLimit: 24,
    categoryLimit: 999999,
    popular: true,
  },
  pro: {
    id: "pro",
    name: "Pro Plan",
    priceMonthly: 499,
    description: "Complete E-commerce platform with Custom Domain & Advanced Features.",
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
    categoryLimit: 999999,
  },
};

/**
 * Utility to check if a plan tier has access to a specific feature key.
 */
export function hasFeatureAccess(planName: string, feature: FeatureKey): boolean {
  const normalized = planName.toLowerCase().replace(/[^a-z]/g, "");
  
  let tier: PlanTier = "startup";
  if (normalized.includes("pro") && !normalized.includes("growth")) tier = "pro";
  else if (normalized.includes("growth")) tier = "growth";
  else if (normalized.includes("startup") || normalized.includes("starter") || normalized.includes("basic") || normalized.includes("free")) tier = "startup";

  const config = PLANS[tier];
  if (!config) return true;

  return config.allowedFeatures.includes(feature);
}

/**
 * Returns required plan for a given feature key.
 */
export function getRequiredPlanForFeature(feature: FeatureKey): PlanTier {
  if (PLANS.startup.allowedFeatures.includes(feature)) return "startup";
  if (PLANS.growth.allowedFeatures.includes(feature)) return "growth";
  return "pro";
}
