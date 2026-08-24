import { createClient } from "@supabase/supabase-js";
const dotenv = require("dotenv");
dotenv.config({ path: ".env.local" });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function run() {
  const { data, error } = await supabase.from("stores").select("*");
  console.log("Error:", error);
  console.log("Stores:", data);
}

run();
