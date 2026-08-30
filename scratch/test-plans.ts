import {
  PLANS,
  PlanTier,
  normalizePlanTier,
  getPlanConfig,
  getProductLimit,
  getCategoryLimit,
  isUnlimitedCategories,
  getPlanDisplayName,
  getPlanHierarchyWeight,
  isPlanAtLeast,
  hasFeature,
  hasFeatureAccess,
  getRequiredPlanForFeature,
  canCreateProduct,
  canCreateCategory,
} from "../src/lib/feature-gating";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${message}`);
}

console.log("=== 1. PLAN CONFIGURATIONS & PRICING ===");
assert(PLANS.startup.priceMonthly === 99, "Startup price is ₹99");
assert(PLANS.growth.priceMonthly === 299, "Growth price is ₹299");
assert(PLANS.pro.priceMonthly === 499, "Pro price is ₹499");
assert(PLANS.premium_ai.priceMonthly === 1499, "Premium / AI price is ₹1,499");

console.log("\n=== 2. PRODUCT LIMITS ===");
assert(getProductLimit("startup") === 12, "Startup product limit is 12");
assert(getProductLimit("growth") === 24, "Growth product limit is 24");
assert(getProductLimit("pro") === 100, "Pro product limit is 100");
assert(getProductLimit("premium_ai") === 100, "Premium/AI product limit is 100");

console.log("\n=== 3. CATEGORY LIMITS ===");
assert(getCategoryLimit("startup") === 1, "Startup category limit is 1");
assert(isUnlimitedCategories("startup") === false, "Startup does NOT have unlimited categories");
assert(isUnlimitedCategories("growth") === true, "Growth has unlimited categories");
assert(isUnlimitedCategories("pro") === true, "Pro has unlimited categories");
assert(isUnlimitedCategories("premium_ai") === true, "Premium/AI has unlimited categories");

console.log("\n=== 4. PLAN TIER NORMALIZATION ===");
assert(normalizePlanTier("startup") === "startup", "Normalizes 'startup'");
assert(normalizePlanTier("Startup Pack") === "startup", "Normalizes 'Startup Pack'");
assert(normalizePlanTier("growth") === "growth", "Normalizes 'growth'");
assert(normalizePlanTier("Growth Pack") === "growth", "Normalizes 'Growth Pack'");
assert(normalizePlanTier("pro") === "pro", "Normalizes 'pro'");
assert(normalizePlanTier("Pro Plan") === "pro", "Normalizes 'Pro Plan'");
assert(normalizePlanTier("premium_ai") === "premium_ai", "Normalizes 'premium_ai'");
assert(normalizePlanTier("premium") === "premium_ai", "Normalizes 'premium'");
assert(normalizePlanTier("ai") === "premium_ai", "Normalizes 'ai'");
assert(normalizePlanTier("Premium / AI Plan") === "premium_ai", "Normalizes 'Premium / AI Plan'");
assert(normalizePlanTier(null) === "startup", "Null defaults to 'startup'");
assert(normalizePlanTier(undefined) === "startup", "Undefined defaults to 'startup'");

console.log("\n=== 5. HIERARCHY & COMPARISON ===");
assert(getPlanHierarchyWeight("startup") === 1, "Startup weight is 1");
assert(getPlanHierarchyWeight("growth") === 2, "Growth weight is 2");
assert(getPlanHierarchyWeight("pro") === 3, "Pro weight is 3");
assert(getPlanHierarchyWeight("premium_ai") === 4, "Premium/AI weight is 4");

assert(isPlanAtLeast("startup", "startup") === true, "Startup >= Startup");
assert(isPlanAtLeast("startup", "growth") === false, "Startup is NOT >= Growth");
assert(isPlanAtLeast("growth", "startup") === true, "Growth >= Startup");
assert(isPlanAtLeast("pro", "growth") === true, "Pro >= Growth");
assert(isPlanAtLeast("premium_ai", "pro") === true, "Premium/AI >= Pro");
assert(isPlanAtLeast("pro", "premium_ai") === false, "Pro is NOT >= Premium/AI");

console.log("\n=== 6. FEATURE ACCESS & ENTITLEMENTS ===");
// WhatsApp Orders (all tiers)
assert(hasFeature("startup", "whatsapp_orders") === true, "Startup has WhatsApp orders");
assert(hasFeature("growth", "whatsapp_orders") === true, "Growth has WhatsApp orders");
assert(hasFeature("pro", "whatsapp_orders") === true, "Pro has WhatsApp orders");
assert(hasFeature("premium_ai", "whatsapp_orders") === true, "Premium/AI has WhatsApp orders");

// Analytics & Coupons (Growth+)
assert(hasFeature("startup", "analytics") === false, "Startup does NOT have analytics");
assert(hasFeature("growth", "analytics") === true, "Growth has analytics");
assert(hasFeature("pro", "analytics") === true, "Pro has analytics");
assert(hasFeature("premium_ai", "analytics") === true, "Premium/AI has analytics");

assert(hasFeature("startup", "coupons") === false, "Startup does NOT have coupons");
assert(hasFeature("growth", "coupons") === true, "Growth has coupons");

// Payments & Custom Domain (Pro+)
assert(hasFeature("startup", "payments") === false, "Startup does NOT have payments");
assert(hasFeature("growth", "payments") === false, "Growth does NOT have payments");
assert(hasFeature("pro", "payments") === true, "Pro has payments");
assert(hasFeature("premium_ai", "payments") === true, "Premium/AI has payments");

assert(hasFeature("startup", "custom_domain") === false, "Startup does NOT have custom domain");
assert(hasFeature("growth", "custom_domain") === false, "Growth does NOT have custom domain");
assert(hasFeature("pro", "custom_domain") === true, "Pro has custom domain");
assert(hasFeature("premium_ai", "custom_domain") === true, "Premium/AI has custom domain");

// AI Features (Premium/AI only)
assert(hasFeature("startup", "ai_commercial_reel") === false, "Startup does NOT have AI reel");
assert(hasFeature("growth", "ai_commercial_reel") === false, "Growth does NOT have AI reel");
assert(hasFeature("pro", "ai_commercial_reel") === false, "Pro does NOT have AI reel");
assert(hasFeature("premium_ai", "ai_commercial_reel") === true, "Premium/AI has AI reel");

assert(hasFeature("startup", "vip_support_24_7") === false, "Startup does NOT have VIP support");
assert(hasFeature("pro", "vip_support_24_7") === false, "Pro does NOT have VIP support");
assert(hasFeature("premium_ai", "vip_support_24_7") === true, "Premium/AI has VIP support");

console.log("\n=== 7. PRODUCT CREATION GATING ===");
// Startup: limit 12
assert(canCreateProduct("startup", 0).allowed === true, "Startup can create 1st product");
assert(canCreateProduct("startup", 11).allowed === true, "Startup can create 12th product");
assert(canCreateProduct("startup", 12).allowed === false, "Startup CANNOT create 13th product");
assert(canCreateProduct("startup", 15).allowed === false, "Startup CANNOT create 16th product");

// Growth: limit 24
assert(canCreateProduct("growth", 23).allowed === true, "Growth can create 24th product");
assert(canCreateProduct("growth", 24).allowed === false, "Growth CANNOT create 25th product");

// Pro: limit 100
assert(canCreateProduct("pro", 99).allowed === true, "Pro can create 100th product");
assert(canCreateProduct("pro", 100).allowed === false, "Pro CANNOT create 101st product");

console.log("\n=== 8. CATEGORY CREATION GATING ===");
// Startup: limit 1
assert(canCreateCategory("startup", 0).allowed === true, "Startup can create 1st category");
assert(canCreateCategory("startup", 1).allowed === false, "Startup CANNOT create 2nd category");

// Growth: unlimited
assert(canCreateCategory("growth", 1).allowed === true, "Growth can create 2nd category");
assert(canCreateCategory("growth", 500).allowed === true, "Growth can create 501st category");

// Pro & Premium/AI: unlimited
assert(canCreateCategory("pro", 1000).allowed === true, "Pro can create unlimited categories");
assert(canCreateCategory("premium_ai", 1000).allowed === true, "Premium/AI can create unlimited categories");

console.log("\n==========================================");
console.log("🎉 ALL SAAS PLAN & ENTITLEMENT TESTS PASSED!");
console.log("==========================================");
