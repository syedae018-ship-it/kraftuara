import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Database } from "@/types/database";

export async function createServerInstance() {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-url.supabase.co";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: any[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options: any }) => {
            let domain = options.domain;
            if (!domain) {
              const reqDomain = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
              try {
                const hostname = new URL(reqDomain).hostname;
                if (hostname === "localhost" || hostname.endsWith(".localhost")) {
                  domain = "localhost";
                } else {
                  const parts = hostname.split(".");
                  if (parts.length >= 2) domain = `.${parts.slice(-2).join(".")}`;
                }
              } catch (e) {}
            }
            cookieStore.set(name, value, { ...options, domain });
          });
        } catch {
          // The `setAll` method was called from a Server Component.
        }
      },
    },
  });
}

export { createServerInstance as createServerSupabaseClient };
