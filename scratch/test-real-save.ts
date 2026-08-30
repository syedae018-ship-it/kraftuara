import * as fs from "fs";
import * as path from "path";

// Populate process.env from .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx > 0) {
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  }
}

import {
  getAllPlans,
  getAuthoritativePlan,
  getPlanPrice,
  updatePlan,
  getPlanAuditLogs,
} from "../src/lib/services/plan-service";
import { getPlanDisplayName } from "../src/lib/feature-gating";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${message}`);
}

async function testRealSave() {
  console.log("=== 1. TESTING LIVE DATABASE SAVE & RETRIEVAL ===");

  // 1. Update Growth Pack: Change price to ₹349 and annual to ₹3490
  console.log("Saving plan changes for Growth...");
  const updateRes = await updatePlan({
    planId: "growth",
    updates: {
      name: "Growth Pack",
      priceMonthly: 349,
      priceAnnual: 3490,
      productLimit: 24,
      categoryLimit: 999999,
      description: "Enhanced growth with Traffic Analytics, Coupons & Multiple Categories.",
    },
    adminEmail: "syed.ae018@gmail.com",
  });

  assert(updateRes.success === true, "updatePlan returned success = true without any schema cache errors");
  assert(updateRes.data?.priceMonthly === 349, "Returned data contains priceMonthly = 349");

  // 2. Query all plans
  console.log("\nQuerying all plans from database...");
  const plans = await getAllPlans(true);
  const growthPlan = plans.find((p) => p.id === "growth");

  assert(Boolean(growthPlan), "Growth plan exists in fetched plans");
  assert(growthPlan?.priceMonthly === 349, "Growth plan price persisted as ₹349 in live database");
  assert(growthPlan?.priceAnnual === 3490, "Growth plan annual price persisted as ₹3,490 in live database");

  // 3. Test getPlanPrice helper
  const price = await getPlanPrice("growth", "monthly");
  assert(price === 349, "getPlanPrice('growth', 'monthly') returns 349");

  const annualPrice = await getPlanPrice("growth", "annual");
  assert(annualPrice === 3490, "getPlanPrice('growth', 'annual') returns 3490");

  // 4. Test Audit Logs retrieval
  console.log("\nChecking audit logs...");
  const logs = await getPlanAuditLogs(10);
  assert(logs.length > 0, `Retrieved ${logs.length} audit log entries`);
  console.log("Latest audit entry:", logs[0]);

  console.log("\n==========================================");
  console.log("🎉 LIVE SUPABASE PLAN PERSISTENCE VERIFIED!");
  console.log("==========================================");
}

testRealSave().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
