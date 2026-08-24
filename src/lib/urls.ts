/**
 * Centralized utility for resolving tenant-aware storefront URLs.
 */

/**
 * Normalizes a store slug consistently across the application:
 * - lowercase
 * - trimmed spaces
 * - replaces all special characters with hyphens
 * - collapses multiple hyphens
 * - strips leading/trailing hyphens
 */
export function normalizeSlug(slug: string): string {
  if (!slug) return "";
  let clean = slug
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (clean.length > 0 && clean.length < 3) {
    clean = `${clean}-store`;
  }
  return clean;
}

/**
 * Returns the absolute URL for a storefront based on its slug.
 * Handles local development (localhost:3000), Vercel deployments (*.vercel.app),
 * and custom domains.
 */
export function getStoreUrl(storeSlug: string, isDemo?: boolean, demoTheme?: string): string {
  if (isDemo || storeSlug === "demo") {
    return "/demo";
  }

  const cleanSlug = normalizeSlug(storeSlug);

  // Client-side execution
  if (typeof window !== "undefined") {
    const origin = window.location.origin;
    const hostname = window.location.hostname;

    // Check if a dedicated custom multi-tenant root domain is configured
    // and ensure it is NOT a vercel.app or localhost domain
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
    const isCustomWildcardDomain =
      rootDomain &&
      !rootDomain.includes("vercel.app") &&
      !rootDomain.includes("localhost") &&
      !rootDomain.includes("127.0.0.1") &&
      hostname.endsWith(rootDomain) &&
      hostname !== rootDomain;

    if (isCustomWildcardDomain) {
      const protocol = window.location.protocol;
      return `${protocol}//${cleanSlug}.${rootDomain}`;
    }

    // Canonical path-based store URL on Vercel deployments, localhost, and single-domain setups
    return `${origin}/store/${cleanSlug}`;
  }

  // Server-side execution
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL;
  if (appUrl) {
    const base = appUrl.startsWith("http") ? appUrl : `https://${appUrl}`;
    return `${base}/store/${cleanSlug}`;
  }

  return `/store/${cleanSlug}`;
}

/**
 * Returns the relative base path for internal navigation inside the storefront.
 * If running on a subdomain, internal links are relative to `/`.
 * If running on the fallback route, links are relative to `/store/[slug]`.
 */
export function getStoreBasePath(storeSlug: string, isSubdomain: boolean, isDemo?: boolean, demoTheme?: string): string {
  if (isDemo || storeSlug === "demo") {
    return "/demo";
  }

  if (isSubdomain) {
    return ""; // Empty string allows relative hash/path like `#category` or `/product/123`
  }

  return `/store/${normalizeSlug(storeSlug)}`;
}
