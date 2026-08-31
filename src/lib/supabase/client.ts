import { createBrowserClient } from "@supabase/ssr";
import { Database } from "@/types/database";

let browserClient: ReturnType<typeof createBrowserClient<Database>> | undefined;

export function createClient() {
  if (typeof window !== "undefined" && browserClient) {
    return browserClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-url.supabase.co";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

  const client = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);

  if (typeof window !== "undefined") {
    browserClient = client;
  }

  return client;
}
