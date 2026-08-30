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

async function testRpc() {
  const rpcs = ["exec_sql", "execute_sql", "run_sql", "query", "sql"];
  for (const rpcName of rpcs) {
    try {
      const { data, error } = await supabase.rpc(rpcName, { sql: "SELECT 1;" });
      console.log(`RPC ${rpcName}:`, error ? error.message : "Success!", data);
    } catch (e: any) {
      console.log(`RPC ${rpcName} exception:`, e.message);
    }
  }
}

testRpc();
