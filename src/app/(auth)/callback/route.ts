import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/";

  // Prevent Open Redirect vulnerability by validating that `next` is a relative path
  let nextPath = "/";
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    nextPath = next;
  }

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(nextPath, request.url));
    }
  }

  // Return to login with error if auth code exchange failed
  return NextResponse.redirect(new URL("/login?error=Authentication%20failed", request.url));
}
