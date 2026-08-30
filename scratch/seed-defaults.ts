import * as fs from "fs";
import * as path from "path";

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

import { updatePlan } from "../src/lib/services/plan-service";
import { PLANS } from "../src/lib/feature-gating";

async function seedDefaults() {
  console.log("Seeding default plan values into Supabase...");
  for (const [tier, cfg] of Object.entries(PLANS)) {
    await updatePlan({
      planId: tier as any,
      updates: cfg,
      adminEmail: "syed.ae018@gmail.com",
    });
    console.log(`✓ Seeded ${cfg.name} (Monthly: ₹${cfg.priceMonthly}, Annual: ₹${cfg.priceAnnual})`);
  }
  console.log("All default SaaS plans seeded into Supabase!");
}

seedDefaults().catch(console.error);
