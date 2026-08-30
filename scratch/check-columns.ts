import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

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

const supabase = createClient(env["NEXT_PUBLIC_SUPABASE_URL"]!, env["SUPABASE_SERVICE_ROLE_KEY"]!);

async function checkDetails() {
  console.log("=== CHECKING TABLE STRUCTURES ===");

  const tables = ["store_settings", "profiles", "stores", "themes", "coupons", "payments", "subscriptions", "activity_logs"];
  for (const t of tables) {
    const { data, error } = await supabase.from(t).select("*").limit(1);
    if (error) {
      console.log(`Table ${t}: Error: ${error.message}`);
    } else {
      console.log(`Table ${t}: Columns:`, data && data[0] ? Object.keys(data[0]) : "Empty table, but exists!");
    }
  }
}

checkDetails();
