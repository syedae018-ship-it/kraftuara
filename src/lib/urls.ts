/**
 * Centralized utility for resolving tenant-aware storefront URLs.
 */

/**
 * Returns the absolute URL for a storefront based on its slug.
 * Handles local development (localhost:3000) and production domains.
 */
export function getStoreUrl(storeSlug: string, isDemo?: boolean, demoTheme?: string): string {
  if (isDemo) {
    return `/demo/${demoTheme || "luxury"}`;
  }

  // Get root domain from environment
  let rootDomain = "";
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_ROOT_DOMAIN) {
    rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
  } else if (typeof window !== "undefined") {
    // Try to infer from window if environment variable is missing
    const host = window.location.host;
    // Exclude subdomains from the inference to get the base domain
    const hostParts = host.split('.');
    if (host.includes("localhost") || host.includes("127.0.0.1")) {
      rootDomain = host;
    } else if (hostParts.length > 2) {
      // e.g. brand.symar.com -> symar.com
      rootDomain = hostParts.slice(-2).join('.');
    } else {
      rootDomain = host;
    }
  }

  // Fallback to relative internal path if we cannot determine a root domain
  if (!rootDomain) {
    return `/store/${storeSlug}`;
  }

  const isLocalhost = rootDomain.includes("localhost") || rootDomain.includes("127.0.0.1");
  const protocol = isLocalhost ? "http://" : "https://";
  
  return `${protocol}${storeSlug}.${rootDomain}`;
}

/**
 * Returns the relative base path for internal navigation inside the storefront.
 * If running on a subdomain, internal links are relative to `/`.
 * If running on the fallback route, links are relative to `/store/[slug]`.
 */
export function getStoreBasePath(storeSlug: string, isSubdomain: boolean, isDemo?: boolean, demoTheme?: string): string {
  if (isDemo) {
    return `/demo/${demoTheme || "luxury"}`;
  }
  
  if (isSubdomain) {
    return ""; // Empty string allows relative hash/path like `#category` or `/product/123`
  }

  return `/store/${storeSlug}`;
}

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
