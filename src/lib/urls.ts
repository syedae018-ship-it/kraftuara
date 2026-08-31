/**
 * Centralized utility for resolving tenant-aware storefront URLs.
 */

import { normalizeSubdomainSlug, RESERVED_SUBDOMAINS } from "./subdomain-utils";

export { normalizeSubdomainSlug, RESERVED_SUBDOMAINS };

/**
 * Normalizes a store slug consistently across the application:
 * - lowercase
 * - trimmed spaces
 * - replaces all special characters with hyphens
 * - collapses multiple hyphens
 * - strips leading/trailing hyphens
 */
export function normalizeSlug(slug: string): string {
  return normalizeSubdomainSlug(slug);
}

/**
 * Returns the absolute canonical public URL for a storefront based on its slug.
 * Prioritizes merchant subdomain (e.g. https://riyaban.kraftaura.in).
 */
export function getStoreUrl(storeSlug: string, isDemo?: boolean, demoTheme?: string): string {
  if (isDemo || storeSlug === "demo") {
    return "/demo";
  }

  const cleanSlug = normalizeSlug(storeSlug);
  const rootDomain = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || "kraftaura.in")
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/:\d+$/, "")
    .replace(/^www\./, "");

  // Client-side execution
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname.toLowerCase();
    const port = window.location.port ? `:${window.location.port}` : "";
    const protocol = window.location.protocol;

    // Localhost multi-tenant support: e.g. http://riyaban.localhost:3000
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return `${protocol}//${cleanSlug}.localhost${port}`;
    }

    // If on a specific preview deployment on *.vercel.app without wildcard DNS
    if (hostname.endsWith(".vercel.app") && !hostname.endsWith(`.${rootDomain}`)) {
      return `${window.location.origin}/store/${cleanSlug}`;
    }

    // Default canonical merchant subdomain URL
    return `https://${cleanSlug}.${rootDomain}`;
  }

  // Server-side execution: default canonical merchant subdomain
  return `https://${cleanSlug}.${rootDomain}`;
}

/**
 * Returns the relative base path for internal navigation inside the storefront.
 * If running on a subdomain (e.g. riyaban.kraftaura.in), internal links are relative to `/`.
 * If running on the fallback route (/store/riyaban), links are relative to `/store/[slug]`.
 */
export function getStoreBasePath(storeSlug: string, isSubdomain: boolean, isDemo?: boolean, demoTheme?: string): string {
  if (isDemo || storeSlug === "demo") {
    return "/demo";
  }

  if (isSubdomain) {
    return ""; // Subdomain URLs stay clean: `/product/abc`, `/cart`, `/contact`, `/track`
  }

  return `/store/${normalizeSlug(storeSlug)}`;
}
