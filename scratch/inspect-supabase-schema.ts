import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// Manually parse .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
const env: Record<string, string> = {};

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
    env[key] = val;
  }
}

const supabaseUrl = env["NEXT_PUBLIC_SUPABASE_URL"];
const serviceKey = env["SUPABASE_SERVICE_ROLE_KEY"];

if (!supabaseUrl || !serviceKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function inspectSchema() {
  console.log("=== INSPECTING LIVE SUPABASE SCHEMA ===");

  const knownTables = [
    "saas_plans",
    "plans",
    "subscription_plans",
    "subscriptions",
    "payments",
    "stores",
    "profiles",
    "products",
    "categories",
    "coupons",
    "orders",
    "themes",
    "templates",
    "email_logs",
    "plan_audit_logs",
  ];

  for (const table of knownTables) {
    try {
      const { data, error } = await supabase.from(table).select("*").limit(1);
      if (error) {
        console.log(`❌ Table '${table}': ERROR (${error.message || error.code})`);
      } else {
        console.log(`✅ Table '${table}' EXISTS! Row count preview: ${data?.length || 0}`);
      }
    } catch (e: any) {
      console.log(`❌ Table '${table}': EXCEPTION (${e.message})`);
    }
  }

  try {
    const { data: storesData, error: storesErr } = await supabase.from("stores").select("id, name, slug").limit(2);
    console.log("\nStores table check:", storesErr ? storesErr.message : `Found ${storesData?.length} stores`);

    const { data: subData, error: subErr } = await supabase.from("subscriptions").select("*").limit(3);
    console.log("\nSubscriptions table structure:", subErr ? subErr.message : JSON.stringify(subData, null, 2));
  } catch (e: any) {
    console.log("Error querying subs:", e.message);
  }
}

inspectSchema();
