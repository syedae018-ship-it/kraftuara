/**
 * Plan Tiers & Feature Gating Engine
 * Master Source of Truth for Kraftaura Subscriptions & Entitlements
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
  | "store_views_analytics"
  | "store_traffic_analytics"
  | "traffic_insights"
  | "collections"
  | "premium_themes"
  | "creative_discounts"
  | "coupons"
  | "orders"
  | "payments"
  | "shipping"
  | "revenue_dashboard"
  | "inventory"
  | "custom_domain";

export interface PlanConfig {
  id: PlanTier;
  name: string;
  priceMonthly: number;
  description: string;
  allowedFeatures: FeatureKey[];
  productLimit: number;
  categoryLimit: number; // 999999 denotes unlimited categories
  popular?: boolean;
  hierarchyWeight: number;
}

export const UNLIMITED_CATEGORY_LIMIT = 999999;

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
    hierarchyWeight: 1,
  },
  growth: {
    id: "growth",
    name: "Growth Pack",
    priceMonthly: 299,
    description: "Enhanced growth with Analytics, Collections, Coupons & Unlimited Categories.",
    allowedFeatures: [
      // Inherits all Startup features
      "dashboard",
      "products",
      "categories",
      "store_settings",
      "appearance",
      "whatsapp_orders",
      // Growth-specific features
      "analytics",
      "store_views_analytics",
      "store_traffic_analytics",
      "traffic_insights",
      "collections",
      "premium_themes",
      "creative_discounts",
      "coupons",
    ],
    productLimit: 24,
    categoryLimit: UNLIMITED_CATEGORY_LIMIT,
    popular: true,
    hierarchyWeight: 2,
  },
  pro: {
    id: "pro",
    name: "Pro Plan",
    priceMonthly: 499,
    description: "Complete E-commerce platform with Custom Domain & Advanced Features.",
    allowedFeatures: [
      // Inherits all Startup & Growth features
      "dashboard",
      "products",
      "categories",
      "store_settings",
      "appearance",
      "whatsapp_orders",
      "analytics",
      "store_views_analytics",
      "store_traffic_analytics",
      "traffic_insights",
      "collections",
      "premium_themes",
      "creative_discounts",
      "coupons",
      // Pro-specific capabilities
      "orders",
      "payments",
      "shipping",
      "revenue_dashboard",
      "inventory",
      "custom_domain",
    ],
    productLimit: 100,
    categoryLimit: UNLIMITED_CATEGORY_LIMIT,
    hierarchyWeight: 3,
  },
};

/**
 * Normalizes any plan string into a canonical PlanTier
 */
export function normalizePlanTier(planName?: string | null): PlanTier {
  if (!planName) return "startup";
  const normalized = planName.toLowerCase().replace(/[^a-z]/g, "");
  
  if (normalized.includes("pro") && !normalized.includes("growth")) return "pro";
  if (normalized.includes("growth")) return "growth";
  return "startup";
}

/**
 * Retrieves the PlanConfig for a given plan tier
 */
export function getPlanConfig(planName?: string | null): PlanConfig {
  const tier = normalizePlanTier(planName);
  return PLANS[tier] || PLANS.startup;
}

/**
 * Returns the product limit for the specified plan
 */
export function getProductLimit(planName?: string | null): number {
  return getPlanConfig(planName).productLimit;
}

/**
 * Returns the category limit for the specified plan
 */
export function getCategoryLimit(planName?: string | null): number {
  return getPlanConfig(planName).categoryLimit;
}

/**
 * Returns true if the plan tier has unlimited categories
 */
export function isUnlimitedCategories(planName?: string | null): boolean {
  return getCategoryLimit(planName) >= UNLIMITED_CATEGORY_LIMIT;
}

/**
 * Returns the human-readable display name for the plan
 */
export function getPlanDisplayName(planName?: string | null): string {
  return getPlanConfig(planName).name;
}

/**
 * Returns hierarchy weight (1 for Startup, 2 for Growth, 3 for Pro)
 */
export function getPlanHierarchyWeight(planName?: string | null): number {
  return getPlanConfig(planName).hierarchyWeight;
}

/**
 * Checks whether user plan meets or exceeds the required plan tier
 */
export function isPlanAtLeast(currentPlan?: string | null, requiredPlan: PlanTier = "startup"): boolean {
  const currentWeight = getPlanHierarchyWeight(currentPlan);
  const requiredWeight = getPlanHierarchyWeight(requiredPlan);
  return currentWeight >= requiredWeight;
}

/**
 * Utility to check if a plan tier has access to a specific feature key.
 */
export function hasFeatureAccess(planName: string, feature: FeatureKey): boolean {
  const config = getPlanConfig(planName);
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
