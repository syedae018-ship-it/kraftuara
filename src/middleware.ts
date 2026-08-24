import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const hostname = request.headers.get("host") || "";
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "platform.com";

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const withCookies = (newResponse: NextResponse) => {
    response.cookies.getAll().forEach((cookie) => {
      newResponse.cookies.set(cookie.name, cookie.value, {
        path: cookie.path,
        domain: cookie.domain,
        maxAge: cookie.maxAge,
        secure: cookie.secure,
        sameSite: cookie.sameSite,
        expires: cookie.expires,
        httpOnly: cookie.httpOnly,
      });
    });
    return newResponse;
  };

  // Multi-Tenant Subdomain / Custom Domain Resolution Architecture
  const isSubdomain =
    hostname.endsWith(`.${rootDomain}`) &&
    hostname !== rootDomain &&
    !hostname.startsWith("app.") &&
    !hostname.startsWith("www.");

  const subdomain = isSubdomain ? hostname.replace(`.${rootDomain}`, "") : null;
  const isAlreadyRewritten = pathname.startsWith(`/store/`);

  if (isSubdomain) {
    // Tenant Isolation: Block access to platform interfaces from public subdomains
    if (
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/admin") ||
      pathname.startsWith("/login") ||
      pathname.startsWith("/signup") ||
      pathname.startsWith("/choose-plan") ||
      pathname.startsWith("/choose-template") ||
      pathname === "/create-store"
    ) {
      const protocol = rootDomain.includes("localhost") || rootDomain.includes("127.0.0.1") ? "http://" : "https://";
      return NextResponse.redirect(new URL(`${pathname}`, `${protocol}${rootDomain}`));
    }

    if (!isAlreadyRewritten) {
      request.headers.set("x-is-subdomain", "true");
      response = NextResponse.rewrite(new URL(`/store/${subdomain}${pathname}`, request.url), {
        request: {
          headers: request.headers,
        }
      });
    }
  }

  // Create a server client for Supabase session management & refresh
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: any[]) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          
          const oldResponse = response;
          if (isSubdomain && !isAlreadyRewritten) {
            response = NextResponse.rewrite(new URL(`/store/${subdomain}${pathname}`, request.url), {
              request: {
                headers: request.headers,
              }
            });
          } else {
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            });
          }
          
          oldResponse.cookies.getAll().forEach((cookie) => {
            response.cookies.set(cookie.name, cookie.value, {
              path: cookie.path,
              domain: cookie.domain,
              maxAge: cookie.maxAge,
              secure: cookie.secure,
              sameSite: cookie.sameSite,
              expires: cookie.expires,
              httpOnly: cookie.httpOnly,
            });
          });
          
          cookiesToSet.forEach(({ name, value, options }) => {
            let domain = options?.domain;
            if (!domain) {
              const reqHost = request.headers.get("host") || "";
              const hostname = reqHost.split(":")[0];
              if (hostname === "localhost" || hostname.endsWith(".localhost")) {
                domain = "localhost";
              } else {
                const parts = hostname.split(".");
                if (parts.length >= 2) {
                  domain = `.${parts.slice(-2).join(".")}`;
                }
              }
            }
            response.cookies.set(name, value, { ...options, domain });
          });
        },
      },
    }
  );

  // Retrieve authenticated user info. getUser() validates the token signature.
  let user = null;
  const mockMode = process.env.NEXT_PUBLIC_MOCK_MODE === "true";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const isSupabaseConfigured = 
    !mockMode && 
    supabaseUrl !== "" && 
    supabaseUrl !== "https://placeholder-url.supabase.co" && 
    supabaseAnonKey !== "" && 
    supabaseAnonKey !== "placeholder-anon-key";

  if (isSupabaseConfigured) {
    try {
      const { data } = await supabase.auth.getUser();
      user = data?.user;
    } catch (e) {
      console.warn("Supabase auth.getUser failed in middleware:", e);
    }
  }

  const isLoggedIn = isSupabaseConfigured ? !!user : true;


  const isDashboardRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/create-store") ||
    pathname.startsWith("/choose-plan") ||
    pathname.startsWith("/choose-template");
  const isAdminRoute = pathname.startsWith("/admin");

  if ((isDashboardRoute || isAdminRoute) && !isLoggedIn) {
    return withCookies(NextResponse.redirect(new URL("/login", request.url)));
  }

  const isMfaRoute = pathname === "/login/mfa" || pathname === "/login/mfa-setup";
  if (isMfaRoute && user) {
    const adminEmails = (process.env.ADMIN_EMAILS || "syed.ae018@gmail.com").split(",");
    if (!adminEmails.includes(user.email || "")) {
      return withCookies(NextResponse.redirect(new URL("/dashboard", request.url)));
    }

    try {
      const { data: mfaData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (mfaData && mfaData.currentLevel === "aal2") {
        return withCookies(NextResponse.redirect(new URL("/admin", request.url)));
      }
    } catch (e) {
      console.error("MFA Level Check on MFA route error:", e);
    }
  }

  if (isAdminRoute && user) {
    const adminEmails = (process.env.ADMIN_EMAILS || "syed.ae018@gmail.com").split(",");
    if (!adminEmails.includes(user.email || "")) {
      return withCookies(NextResponse.redirect(new URL("/dashboard", request.url)));
    }

    try {
      const { data: mfaData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (mfaData && mfaData.currentLevel !== "aal2") {
        if (mfaData.nextLevel === "aal2") {
          return withCookies(NextResponse.redirect(new URL("/login/mfa", request.url)));
        } else {
          return withCookies(NextResponse.redirect(new URL("/login/mfa-setup", request.url)));
        }
      }
    } catch (e) {
      console.error("MFA Assurance Level Check Error:", e);
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
