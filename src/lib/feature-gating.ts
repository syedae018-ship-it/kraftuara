/**
 * Plan Tiers & Feature Gating Engine
 * Master Single Source of Truth for Kraftaura Subscriptions, Limits & Entitlements
 */

export type PlanTier = "startup" | "growth" | "pro" | "premium_ai";
export type PlanId = PlanTier;
export type BillingInterval = "monthly" | "annual";

export type FeatureKey =
  | "dashboard"
  | "products"
  | "categories"
  | "store_settings"
  | "appearance"
  | "whatsapp_orders"
  | "shipping"
  | "analytics"
  | "store_views_analytics"
  | "store_traffic_analytics"
  | "traffic_insights"
  | "creative_discounts"
  | "coupons"
  | "collections"
  | "orders"
  | "order_management"
  | "customer_order_tracking"
  | "order_tracking"
  | "premium_themes"
  | "advanced_themes"
  | "payments"
  | "revenue_dashboard"
  | "inventory"
  | "custom_domain"
  | "ai_commercial_reel"
  | "product_mockups"
  | "vip_support_24_7";

export interface PlanConfig {
  id: PlanTier;
  name: string;
  priceMonthly: number;
  priceAnnual: number;
  description: string;
  allowedFeatures: FeatureKey[];
  productLimit: number;
  categoryLimit: number; // 999999 denotes unlimited categories
  popular?: boolean;
  badge?: string;
  hierarchyWeight: number;
  featuresDisplay: string[];
  status?: "active" | "inactive" | "archived";
  isTrialEligible?: boolean;
  trialDays?: number;
  displayOrder?: number;
  updatedAt?: string;
}

export const UNLIMITED_CATEGORY_LIMIT = 999999;

export const PLANS: Record<PlanTier, PlanConfig> = {
  startup: {
    id: "startup",
    name: "Startup Pack",
    priceMonthly: 99,
    priceAnnual: 990,
    description: "Perfect for new merchants & WhatsApp catalog storefronts.",
    allowedFeatures: [
      "dashboard",
      "products",
      "categories",
      "store_settings",
      "appearance",
      "whatsapp_orders",
      "shipping",
    ],
    productLimit: 12,
    categoryLimit: 1,
    hierarchyWeight: 1,
    displayOrder: 1,
    status: "active",
    isTrialEligible: false,
    trialDays: 0,
    featuresDisplay: [
      "WhatsApp Catalog Order Routing",
      "Basic Merchant Dashboard",
      "Product Management (up to 12 products)",
      "Single Category Catalog Setup",
      "Dedicated Storefront URL Link",
      "Kraftaura Classic Theme Template",
      "Custom Store Logo & Branding",
    ],
  },
  growth: {
    id: "growth",
    name: "Growth Pack",
    priceMonthly: 299,
    priceAnnual: 2990,
    description: "Enhanced growth with Traffic Analytics, Coupons & Multiple Categories.",
    allowedFeatures: [
      // Inherits all Startup features
      "dashboard",
      "products",
      "categories",
      "store_settings",
      "appearance",
      "whatsapp_orders",
      "shipping",
      // Growth-specific features
      "analytics",
      "store_views_analytics",
      "store_traffic_analytics",
      "traffic_insights",
      "creative_discounts",
      "coupons",
      "orders",
      "order_management",
      "customer_order_tracking",
    ],
    productLimit: 24,
    categoryLimit: UNLIMITED_CATEGORY_LIMIT,
    popular: true,
    badge: "MOST POPULAR",
    hierarchyWeight: 2,
    displayOrder: 2,
    status: "active",
    isTrialEligible: true,
    trialDays: 3,
    featuresDisplay: [
      "Everything in Startup Pack",
      "Product Management (up to 24 products)",
      "Unlimited Category Classifications",
      "Store Views & Traffic Source Analytics",
      "Merchant Coupons & Promo Discount Codes",
      "Customer Order Status Tracking",
      "Advanced Appearance Customization",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro Plan",
    priceMonthly: 499,
    priceAnnual: 4990,
    description: "Complete E-commerce with Direct Payments, Invoicing & Custom Domains.",
    allowedFeatures: [
      // Inherits all Startup & Growth features
      "dashboard",
      "products",
      "categories",
      "store_settings",
      "appearance",
      "whatsapp_orders",
      "shipping",
      "analytics",
      "store_views_analytics",
      "store_traffic_analytics",
      "traffic_insights",
      "creative_discounts",
      "coupons",
      // Pro-specific capabilities
      "collections",
      "orders",
      "order_management",
      "customer_order_tracking",
      "premium_themes",
      "advanced_themes",
      "payments",
      "revenue_dashboard",
      "inventory",
      "custom_domain",
    ],
    productLimit: 100,
    categoryLimit: UNLIMITED_CATEGORY_LIMIT,
    badge: "FULL E-COMMERCE",
    hierarchyWeight: 3,
    displayOrder: 3,
    status: "active",
    isTrialEligible: true,
    trialDays: 3,
    featuresDisplay: [
      "Everything in Growth Pack",
      "Product Management (up to 100 products)",
      "Direct Razorpay Online Payments & Checkout",
      "Order Management & Customer Invoicing",
      "Custom Domain Mapping & SSL",
      "Revenue Analytics & Sales Graphs",
      "Real-time Inventory & Stock Alerts",
      "Curated Store Collections",
      "Premium Designer Store Themes",
    ],
  },
  premium_ai: {
    id: "premium_ai",
    name: "Premium / AI Plan",
    priceMonthly: 1499,
    priceAnnual: 14990,
    description: "VIP growth suite with Pro E-commerce, AI Commercials & 24/7 Dedicated Support.",
    allowedFeatures: [
      // Inherits all Pro features
      "dashboard",
      "products",
      "categories",
      "store_settings",
      "appearance",
      "whatsapp_orders",
      "shipping",
      "analytics",
      "store_views_analytics",
      "store_traffic_analytics",
      "traffic_insights",
      "creative_discounts",
      "coupons",
      "collections",
      "orders",
      "order_management",
      "customer_order_tracking",
      "premium_themes",
      "advanced_themes",
      "payments",
      "revenue_dashboard",
      "inventory",
      "custom_domain",
      // Premium / AI additions
      "ai_commercial_reel",
      "product_mockups",
      "vip_support_24_7",
    ],
    productLimit: 100,
    categoryLimit: UNLIMITED_CATEGORY_LIMIT,
    badge: "AI SUITE & VIP",
    hierarchyWeight: 4,
    displayOrder: 4,
    status: "active",
    isTrialEligible: true,
    trialDays: 3,
    featuresDisplay: [
      "Everything in Pro Plan",
      "1 AI Ad Commercial Video Reel",
      "10 High-Resolution Product Mockups",
      "24/7 Dedicated Merchant Support",
      "Custom Domain & Razorpay Payments",
      "All Pro E-commerce Functionality",
    ],
  },
};

/**
 * Normalizes any plan string into a canonical PlanTier
 */
export function normalizePlanTier(planName?: string | null): PlanTier {
  if (!planName) return "startup";
  const normalized = planName.toLowerCase().trim().replace(/[^a-z0-9_]/g, "");

  if (
    normalized.includes("premium") ||
    normalized.includes("ai") ||
    normalized === "premium_ai" ||
    normalized === "premiumai"
  ) {
    return "premium_ai";
  }

  if (normalized.includes("pro") && !normalized.includes("growth")) return "pro";
  if (normalized.includes("growth")) return "growth";
  return "startup";
}

/**
 * In-memory active plans registry populated dynamically from database / plan-service.
 */
let dynamicPlansRegistry: Record<PlanTier, PlanConfig> = { ...PLANS };

/**
 * Returns the current in-memory dynamic plans registry.
 */
export function getDynamicPlansRegistry(): Record<PlanTier, PlanConfig> {
  return dynamicPlansRegistry;
}

/**
 * Updates the in-memory plan registry dynamically.
 */
export function setDynamicPlansRegistry(updatedPlans: Record<PlanTier, PlanConfig>) {
  dynamicPlansRegistry = { ...dynamicPlansRegistry, ...updatedPlans };
}

/**
 * Retrieves the PlanConfig for a given plan tier
 */
export function getPlanConfig(planName?: string | null): PlanConfig {
  const tier = normalizePlanTier(planName);
  return dynamicPlansRegistry[tier] || PLANS[tier] || PLANS.startup;
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
 * Returns hierarchy weight (1 for Startup, 2 for Growth, 3 for Pro, 4 for Premium/AI)
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
 * Checks if a plan tier has access to a specific feature key.
 */
export function hasFeature(planName?: string | null, feature?: FeatureKey | string): boolean {
  if (!feature) return true;
  const canonicalFeature = feature === "order_tracking" ? "customer_order_tracking" : feature;
  const config = getPlanConfig(planName);
  return config.allowedFeatures.includes(canonicalFeature as FeatureKey) || config.allowedFeatures.includes(feature as FeatureKey);
}

/**
 * Alias for hasFeature for compatibility across components.
 */
export function hasFeatureAccess(planName?: string | null, feature?: FeatureKey | string): boolean {
  return hasFeature(planName, feature);
}

/**
 * Returns the minimum required plan for a given feature key.
 */
export function getRequiredPlanForFeature(feature: FeatureKey): PlanTier {
  const plans = Object.values(dynamicPlansRegistry);
  const sorted = [...plans].sort((a, b) => a.hierarchyWeight - b.hierarchyWeight);
  for (const p of sorted) {
    if (p.allowedFeatures.includes(feature)) {
      return p.id;
    }
  }
  return "premium_ai";
}

/**
 * Returns a specific limit (e.g. products, categories) for a plan.
 */
export function getPlanLimit(planName?: string | null, limitType: "products" | "categories" = "products"): number {
  return limitType === "products" ? getProductLimit(planName) : getCategoryLimit(planName);
}

/**
 * Centralized entitlement validation for creating a product.
 */
export function canCreateProduct(
  planName: string | null | undefined,
  currentCount: number
): { allowed: boolean; limit: number; current: number; message?: string } {
  const tier = normalizePlanTier(planName);
  const planCfg = getPlanConfig(tier);
  const limit = planCfg.productLimit;
  const allowed = currentCount < limit;

  if (!allowed) {
    const displayName = planCfg.name;
    const message = `You've reached your ${limit}-product limit for ${displayName}. Upgrade your plan to add more products.`;
    return { allowed: false, limit, current: currentCount, message };
  }

  return { allowed: true, limit, current: currentCount };
}

/**
 * Centralized entitlement validation for creating a category.
 */
export function canCreateCategory(
  planName: string | null | undefined,
  currentCount: number
): { allowed: boolean; limit: number; current: number; isUnlimited: boolean; message?: string } {
  const tier = normalizePlanTier(planName);
  const planCfg = getPlanConfig(tier);
  const isUnlimited = planCfg.categoryLimit >= UNLIMITED_CATEGORY_LIMIT;
  const limit = planCfg.categoryLimit;

  if (isUnlimited) {
    return { allowed: true, limit, current: currentCount, isUnlimited: true };
  }

  const allowed = currentCount < limit;
  if (!allowed) {
    const displayName = planCfg.name;
    const message = `${displayName} allows ${limit} category maximum. Upgrade your plan to create more categories.`;
    return { allowed: false, limit, current: currentCount, isUnlimited: false, message };
  }

  return { allowed: true, limit, current: currentCount, isUnlimited: false };
}
