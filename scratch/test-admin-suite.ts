import { isAdminUser } from "../src/lib/services/admin-roles";
import { PLANS } from "../src/lib/feature-gating";

function runAdminTestSuite() {
  console.log("==================================================");
  console.log("  KRAFTAURA ADMIN DASHBOARD PRODUCTION TEST SUITE ");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, name: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${name}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${name}`);
      failed++;
    }
  }

  // 1. Authorization checks
  console.log("\n[1] Admin Authorization & Role Guard");
  assert(isAdminUser("syed.ae018@gmail.com", null) === true, "Admin email syed.ae018@gmail.com is authorized");
  assert(isAdminUser(null, "admin") === true, "Role 'admin' is authorized");
  assert(isAdminUser(null, "super_admin") === true, "Role 'super_admin' is authorized");
  assert(isAdminUser("merchant@store.com", "merchant") === false, "Regular merchant is blocked");
  assert(isAdminUser("hacker@unknown.com", null) === false, "Unknown user is blocked");

  // 2. Centralized Plan Pricing
  console.log("\n[2] Centralized SaaS Plan Pricing");
  assert(PLANS.startup.priceMonthly === 99, "Startup Plan is ₹99/month");
  assert(PLANS.growth.priceMonthly === 299, "Growth Plan is ₹299/month");
  assert(PLANS.pro.priceMonthly === 499, "Pro Plan is ₹499/month");

  // 3. MRR Calculation Logic
  console.log("\n[3] Dynamic MRR Calculation");
  const sampleSubscriptions = [
    { plan: "startup", status: "active" },
    { plan: "startup", status: "active" },
    { plan: "growth", status: "active" },
    { plan: "pro", status: "active" },
    { plan: "growth", status: "cancelled" }, // should not count
  ];

  const planPrices: Record<string, number> = {
    startup: PLANS.startup.priceMonthly,
    growth: PLANS.growth.priceMonthly,
    pro: PLANS.pro.priceMonthly,
  };

  const activeSubs = sampleSubscriptions.filter((s) => s.status === "active");
  const calculatedMRR = activeSubs.reduce((sum, s) => sum + (planPrices[s.plan] || 0), 0);
  const expectedMRR = 99 + 99 + 299 + 499; // 996
  assert(calculatedMRR === expectedMRR, `Calculated MRR ₹${calculatedMRR} matches expected ₹${expectedMRR}`);

  // 4. Promo Code Validation Logic
  console.log("\n[4] SaaS Promo Code Discount Computations");
  const percentagePromo = { code: "KRAFT20", discountType: "percentage", value: 20 };
  const flatPromo = { code: "FLAT50", discountType: "flat", value: 50 };

  const startupPrice = PLANS.startup.priceMonthly; // 99
  const growthPrice = PLANS.growth.priceMonthly; // 299

  const pDiscount = Math.round((growthPrice * percentagePromo.value) / 100); // 60
  const pFinal = growthPrice - pDiscount; // 239
  assert(pDiscount === 60 && pFinal === 239, `20% discount on ₹299 Growth = -₹60, Final ₹239`);

  const fDiscount = Math.min(startupPrice, flatPromo.value); // 50
  const fFinal = startupPrice - fDiscount; // 49
  assert(fDiscount === 50 && fFinal === 49, `₹50 flat discount on ₹99 Startup = -₹50, Final ₹49`);

  console.log("\n==================================================");
  console.log(`TEST RESULTS: ${passed} Passed, ${failed} Failed`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runAdminTestSuite();
