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

async function testActivityLogs() {
  const testPayload = {
    plan_id: "growth",
    name: "Growth Pack",
    price_monthly: 299,
    price_annual: 2990,
  };

  const { data, error } = await supabase.from("activity_logs").insert({
    action: "saas_plan_config_growth",
    details: testPayload,
  }).select();

  console.log("Insert activity_logs result:", error ? error.message : "Success!", data);

  const { data: fetchLogs, error: fetchErr } = await supabase
    .from("activity_logs")
    .select("*")
    .like("action", "saas_plan_config_%")
    .order("created_at", { ascending: false });

  console.log("Fetch saas_plan_config logs:", fetchErr ? fetchErr.message : `Found ${fetchLogs?.length} config records`);
}

testActivityLogs();
