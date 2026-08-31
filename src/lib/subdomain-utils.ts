/**
 * Multi-Tenant Subdomain & Domain Utilities
 * Canonical helper functions for hostname parsing, slug validation, and reserved subdomain protection.
 */

export const RESERVED_SUBDOMAINS = new Set([
  "www",
  "admin",
  "dashboard",
  "app",
  "api",
  "auth",
  "login",
  "signup",
  "support",
  "help",
  "billing",
  "payments",
  "status",
  "docs",
  "mail",
  "cdn",
  "static",
  "preview",
  "demo",
  "assets",
  "platform",
  "staging",
  "dev",
  "test",
  "root",
  "store",
  "stores",
  "shop",
  "shops",
  "checkout",
  "cart",
  "account",
  "settings",
]);

/**
 * Validates whether a store slug can safely be used as a merchant subdomain.
 * Rules:
 * - 3 to 63 characters
 * - Only lowercase alphanumeric characters and hyphens
 * - Cannot start or end with a hyphen
 * - Cannot be in the reserved subdomains list
 */
export function isValidSubdomainSlug(slug?: string): { valid: boolean; reason?: string } {
  if (!slug) {
    return { valid: false, reason: "Slug cannot be empty." };
  }

  const clean = slug.trim().toLowerCase();

  if (clean.length < 3) {
    return { valid: false, reason: "Subdomain must be at least 3 characters long." };
  }

  if (clean.length > 63) {
    return { valid: false, reason: "Subdomain cannot exceed 63 characters." };
  }

  if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(clean)) {
    return {
      valid: false,
      reason: "Subdomain can only contain lowercase letters, numbers, and hyphens (cannot start or end with a hyphen).",
    };
  }

  if (RESERVED_SUBDOMAINS.has(clean)) {
    return { valid: false, reason: `"${clean}" is a reserved system subdomain and cannot be assigned to a store.` };
  }

  return { valid: true };
}

/**
 * Normalizes input name into a safe, DNS-compliant subdomain slug.
 */
export function normalizeSubdomainSlug(input?: string): string {
  if (!input) return "";

  let clean = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (clean.length > 0 && clean.length < 3) {
    clean = `${clean}-store`;
  }

  if (RESERVED_SUBDOMAINS.has(clean)) {
    clean = `${clean}-shop`;
  }

  return clean;
}

/**
 * Extracts merchant subdomain from incoming request hostname.
 */
export function extractSubdomainFromHostname(hostname?: string, configuredRootDomain?: string): string | null {
  if (!hostname) return null;

  const cleanHost = hostname.toLowerCase().split(":")[0].trim();
  const rootDomain = (configuredRootDomain || process.env.NEXT_PUBLIC_ROOT_DOMAIN || "kraftaura.in")
    .toLowerCase()
    .split(":")[0]
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "");

  // 1. Local development: e.g. riyaban.localhost or riyaban.127.0.0.1
  if (cleanHost.endsWith(".localhost") || cleanHost.endsWith(".127.0.0.1")) {
    const parts = cleanHost.split(".");
    if (parts.length >= 2) {
      const sub = parts[0];
      if (isValidSubdomainSlug(sub).valid) {
        return sub;
      }
    }
    return null;
  }

  // 2. Ignore apex root, www, or preview vercel.app domains for subdomain extraction
  if (
    cleanHost === rootDomain ||
    cleanHost === `www.${rootDomain}` ||
    cleanHost.endsWith(".vercel.app")
  ) {
    return null;
  }

  // 3. Merchant subdomain check: e.g. riyaban.kraftaura.in
  if (cleanHost.endsWith(`.${rootDomain}`)) {
    const candidate = cleanHost.slice(0, -(rootDomain.length + 1));
    if (isValidSubdomainSlug(candidate).valid) {
      return candidate;
    }
  }

  return null;
}
