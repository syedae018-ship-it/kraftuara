import {
  PLANS,
  getPlanConfig,
  getPlanDisplayName,
  getPlanLimit,
  canCreateProduct,
  canCreateCategory,
  hasFeatureAccess,
  setDynamicPlansRegistry,
  normalizePlanTier,
} from "../src/lib/feature-gating";
import {
  getAllPlans,
  getAuthoritativePlan,
  getPlanPrice,
  updatePlan,
} from "../src/lib/services/plan-service";
import { resolvePlanFromRazorpay } from "../src/config/razorpay";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${message}`);
}

async function runTestMatrix() {
  console.log("==========================================");
  console.log("🧪 KRAFTAURA SAAS PLAN ENGINE TEST SUITE");
  console.log("==========================================");

  console.log("\n=== TEST 1: RENAME PROPAGATION ===");
  // Test initial default name
  assert(getPlanDisplayName("startup") === "Startup Pack", "Default startup name is Startup Pack");

  // Admin renames Startup Pack -> Launch Pack
  await updatePlan({
    planId: "startup",
    updates: { name: "Launch Pack" },
    adminEmail: "admin@kraftaura.in",
  });

  assert(getPlanDisplayName("startup") === "Launch Pack", "Renamed display name propagates to getPlanDisplayName");
  const productCheck = canCreateProduct("startup", 12);
  assert(productCheck.allowed === false, "Product limit blocks when at capacity");
  assert(productCheck.message?.includes("Launch Pack") || false, "Feature-lock and quota messages dynamically use new name 'Launch Pack'");

  console.log("\n=== TEST 2: PRICE CHANGE PROPAGATION ===");
  // Admin changes Growth price: ₹299 -> ₹349 monthly, ₹2990 -> ₹3490 annual
  await updatePlan({
    planId: "growth",
    updates: { priceMonthly: 349, priceAnnual: 3490 },
    adminEmail: "admin@kraftaura.in",
  });

  const growthMonthly = await getPlanPrice("growth", "monthly");
  const growthAnnual = await getPlanPrice("growth", "annual");
  assert(growthMonthly === 349, "getPlanPrice returns updated monthly price ₹349");
  assert(growthAnnual === 3490, "getPlanPrice returns updated annual price ₹3490");

  console.log("\n=== TEST 3: ANNUAL BILLING & RAZORPAY AMOUNTS ===");
  const proAnnual = await getPlanPrice("pro", "annual");
  assert(proAnnual === 4990, "Pro annual price is ₹4,990");
  const proAnnualPaise = proAnnual * 100;
  assert(proAnnualPaise === 499000, "Razorpay annual amount in paise is 499,000 paise (₹4,990)");

  console.log("\n=== TEST 4: FEATURE ENTITLEMENTS ===");
  assert(hasFeatureAccess("growth", "analytics") === true, "Growth has analytics access");
  assert(hasFeatureAccess("startup", "analytics") === false, "Startup lacks analytics access");
  assert(hasFeatureAccess("pro", "custom_domain") === true, "Pro has custom domain access");
  assert(hasFeatureAccess("growth", "custom_domain") === false, "Growth lacks custom domain access");
  assert(hasFeatureAccess("premium_ai", "ai_commercial_reel") === true, "Premium AI has AI commercial reel access");

  console.log("\n=== TEST 5: LIMIT ENFORCEMENT ===");
  // Startup product limit: 12
  const startupUnder = canCreateProduct("startup", 11);
  assert(startupUnder.allowed === true, "Startup can create 12th product when at 11");
  const startupFull = canCreateProduct("startup", 12);
  assert(startupFull.allowed === false, "Startup cannot create 13th product when at 12");

  // Growth product limit: 24
  const growthUnder = canCreateProduct("growth", 23);
  assert(growthUnder.allowed === true, "Growth can create 24th product when at 23");
  const growthFull = canCreateProduct("growth", 24);
  assert(growthFull.allowed === false, "Growth cannot create 25th product when at 24");

  // Category limits
  const startupCatFull = canCreateCategory("startup", 1);
  assert(startupCatFull.allowed === false, "Startup cannot create 2nd category");
  const growthCat = canCreateCategory("growth", 50);
  assert(growthCat.allowed === true && growthCat.isUnlimited === true, "Growth has unlimited categories");

  console.log("\n=== TEST 6: PLAN ACTIVATION & DEACTIVATION ===");
  await updatePlan({
    planId: "premium_ai",
    updates: { status: "inactive" },
    adminEmail: "admin@kraftaura.in",
  });

  const activePlans = await getAllPlans(false);
  assert(!activePlans.some((p) => p.id === "premium_ai"), "Inactive plan is excluded from public active plans");
  const allPlansWithInactive = await getAllPlans(true);
  assert(allPlansWithInactive.some((p) => p.id === "premium_ai"), "Inactive plan is included for Admin catalog");

  // Reactivate plan
  await updatePlan({
    planId: "premium_ai",
    updates: { status: "active" },
    adminEmail: "admin@kraftaura.in",
  });
  const reactivatedPlans = await getAllPlans(false);
  assert(reactivatedPlans.some((p) => p.id === "premium_ai"), "Reactivated plan is now visible in public active plans");

  console.log("\n=== TEST 7: RESOLVING TIER FROM RAZORPAY SUBSCRIPTION ===");
  const resolvedFromNotes = resolvePlanFromRazorpay({ notes: { planName: "growth" } });
  assert(resolvedFromNotes === "growth", "Resolved growth tier from notes");

  const resolvedFromAnnualAmount = resolvePlanFromRazorpay({ amount: 499000 });
  assert(resolvedFromAnnualAmount === "pro", "Resolved pro tier from annual amount (499,000 paise)");

  const resolvedFromMonthlyAmount = resolvePlanFromRazorpay({ amount: 149900 });
  assert(resolvedFromMonthlyAmount === "premium_ai", "Resolved premium_ai tier from monthly amount (149,900 paise)");

  console.log("\n==========================================");
  console.log("🎉 ALL SAAS PLAN ENGINE TESTS PASSED 100%!");
  console.log("==========================================");
}

runTestMatrix().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
