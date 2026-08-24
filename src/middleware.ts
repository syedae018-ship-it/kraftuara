import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  try {
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

    const mockMode = process.env.NEXT_PUBLIC_MOCK_MODE === "true";
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    const isSupabaseConfigured = 
      !mockMode && 
      supabaseUrl !== "" && 
      supabaseUrl !== "https://placeholder-url.supabase.co" && 
      supabaseAnonKey !== "" && 
      supabaseAnonKey !== "placeholder-anon-key";

    // Create a server client for Supabase session management & refresh
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

    // Retrieve authenticated user info. getUser() validates the token signature.
    let user = null;
    if (isSupabaseConfigured && supabase) {
      try {
        const { data } = await supabase.auth.getUser();
        user = data?.user;
      } catch (e) {
        console.warn("Supabase auth.getUser failed in middleware:", e);
      }
    }

    const isLoggedIn = isSupabaseConfigured && supabase ? !!user : true;

    const isDashboardRoute =
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/create-store") ||
      pathname.startsWith("/choose-plan") ||
      pathname.startsWith("/choose-template");
    const isAdminRoute = pathname.startsWith("/admin");

    const adminEmails = (process.env.ADMIN_EMAILS || "syed.ae018@gmail.com")
      .split(",")
      .map((e) => e.trim().toLowerCase());
    const userEmail = (user?.email || "").toLowerCase();
    const isUserAdmin = !!userEmail && adminEmails.includes(userEmail);

    if ((isDashboardRoute || isAdminRoute) && !isLoggedIn) {
      return withCookies(NextResponse.redirect(new URL("/login", request.url)));
    }

    if (isAdminRoute && isSupabaseConfigured && supabase) {
      if (!isUserAdmin) {
        return withCookies(NextResponse.redirect(new URL("/dashboard", request.url)));
      }
    }

    return response;
  } catch (err) {
    console.error("Critical error in middleware invocation safety net:", err);
    // Return NextResponse.next() to avoid MIDDLEWARE_INVOCATION_FAILED (500)
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
