import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { extractSubdomainFromHostname, RESERVED_SUBDOMAINS } from "@/lib/subdomain-utils";

export async function middleware(request: NextRequest) {
  try {
    const pathname = request.nextUrl.pathname;
    const rawHost = request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
    const hostname = rawHost.split(",")[0].trim();
    const rootDomain = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || "kraftaura.in")
      .toLowerCase()
      .split(":")[0]
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "");

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

    // 1. Multi-Tenant Subdomain Resolution Architecture
    const subdomain = extractSubdomainFromHostname(hostname, rootDomain);
    const isAlreadyRewritten = pathname.startsWith(`/store/`);

    // Allow API routes and static metadata files to pass directly without store rewriting
    const isSystemOrApiRoute =
      pathname.startsWith("/api") ||
      pathname.startsWith("/_next") ||
      pathname === "/favicon.ico" ||
      pathname === "/robots.txt" ||
      pathname === "/sitemap.xml";

    if (subdomain && !isSystemOrApiRoute) {
      // Tenant Isolation: Block access to platform management from merchant subdomains
      if (
        pathname.startsWith("/dashboard") ||
        pathname.startsWith("/admin") ||
        pathname.startsWith("/login") ||
        pathname.startsWith("/signup") ||
        pathname.startsWith("/choose-plan") ||
        pathname.startsWith("/choose-template") ||
        pathname === "/create-store" ||
        pathname === "/pricing"
      ) {
        const protocol = rootDomain.includes("localhost") || rootDomain.includes("127.0.0.1") ? "http://" : "https://";
        return NextResponse.redirect(new URL(`${pathname}${request.nextUrl.search}`, `${protocol}${rootDomain}`));
      }

      if (!isAlreadyRewritten) {
        request.headers.set("x-is-subdomain", "true");
        request.headers.set("x-store-slug", subdomain);
        request.headers.set("x-subdomain", subdomain);

        const rewriteTarget = new URL(`/store/${subdomain}${pathname}`, request.url);
        rewriteTarget.search = request.nextUrl.search;
        response = NextResponse.rewrite(rewriteTarget, {
          request: {
            headers: request.headers,
          },
        });
      }
    } else if (!subdomain && pathname.startsWith("/store/")) {
      // 2. Legacy /store/{slug} URL 308 permanent redirect to canonical merchant subdomain
      const parts = pathname.replace(/^\/store\//, "").split("/");
      const slug = parts[0];
      const subPath = parts.slice(1).join("/");

      if (slug && !RESERVED_SUBDOMAINS.has(slug)) {
        const isLocalhost = hostname.includes("localhost") || hostname.includes("127.0.0.1");
        const port = request.nextUrl.port ? `:${request.nextUrl.port}` : "";
        const targetUrl = isLocalhost
          ? `http://${slug}.localhost${port}${subPath ? `/${subPath}` : ""}${request.nextUrl.search}`
          : `https://${slug}.${rootDomain}${subPath ? `/${subPath}` : ""}${request.nextUrl.search}`;

        return NextResponse.redirect(new URL(targetUrl), 308);
      }
    }

    // 3. Supabase Auth Session Management & Refresh
    const mockMode = process.env.NEXT_PUBLIC_MOCK_MODE === "true";
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    const isSupabaseConfigured = 
      !mockMode && 
      supabaseUrl !== "" && 
      supabaseUrl !== "https://placeholder-url.supabase.co" && 
      supabaseAnonKey !== "" && 
      supabaseAnonKey !== "placeholder-anon-key";

    let supabase = null;
    if (isSupabaseConfigured) {
      try {
        supabase = createServerClient(
          supabaseUrl,
          supabaseAnonKey,
          {
            cookies: {
              getAll() {
                return request.cookies.getAll();
              },
              setAll(cookiesToSet: any[]) {
                try {
                  cookiesToSet.forEach(({ name, value }) => {
                    request.cookies.set(name, value);
                  });
                  
                  const oldResponse = response;
                  if (subdomain && !isAlreadyRewritten && !isSystemOrApiRoute) {
                    const rewriteTarget = new URL(`/store/${subdomain}${pathname}`, request.url);
                    rewriteTarget.search = request.nextUrl.search;
                    response = NextResponse.rewrite(rewriteTarget, {
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
                    response.cookies.set(name, value, options);
                  });
                } catch (e) {
                  console.error("Error setting cookies inside Supabase client:", e);
                }
              },
            },
          }
        );
      } catch (e) {
        console.error("Failed to construct Supabase client in middleware:", e);
        supabase = null;
      }
    }

    const isDashboardRoute =
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/create-store") ||
      pathname.startsWith("/choose-plan") ||
      pathname.startsWith("/choose-template");
    const isAdminRoute = pathname.startsWith("/admin");
    const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/signup");

    // 4. Retrieve authenticated user info only when needed (protected or auth routes) with timeout safety
    let user = null;
    if (isSupabaseConfigured && supabase && (isDashboardRoute || isAdminRoute || isAuthRoute)) {
      try {
        const userPromise = supabase.auth.getUser();
        const timeoutPromise = new Promise<{ data: { user: null } }>((resolve) =>
          setTimeout(() => resolve({ data: { user: null } }), 3000)
        );
        const { data } = await Promise.race([userPromise, timeoutPromise]);
        user = data?.user;
      } catch (e) {
        console.warn("Supabase auth.getUser failed in middleware:", e);
      }
    }

    const isLoggedIn = isSupabaseConfigured && supabase ? !!user : true;

    const adminEmails = (process.env.ADMIN_EMAILS || "syed.ae018@gmail.com")
      .split(",")
      .map((e) => e.trim().toLowerCase());
    const userEmail = (user?.email || "").toLowerCase();
    const isUserAdmin = !!userEmail && adminEmails.includes(userEmail);

    // Redirect logged-in users away from login/signup
    if (isAuthRoute && user) {
      return withCookies(NextResponse.redirect(new URL(isUserAdmin ? "/admin" : "/dashboard", request.url)));
    }

    if ((isDashboardRoute || isAdminRoute) && !isLoggedIn) {
      return withCookies(NextResponse.redirect(new URL("/login", request.url)));
    }

    const hasImpersonation = request.cookies.has("kraftaura_impersonation");

    if (isLoggedIn && isUserAdmin && !hasImpersonation) {
      if (isDashboardRoute) {
        return withCookies(NextResponse.redirect(new URL("/admin", request.url)));
      }
    } else if (isAdminRoute && isSupabaseConfigured && supabase) {
      if (!isUserAdmin) {
        return withCookies(NextResponse.redirect(new URL("/dashboard", request.url)));
      }
    }

    return response;
  } catch (err) {
    console.error("Critical error in middleware invocation safety net:", err);
    return NextResponse.next();
  }
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
