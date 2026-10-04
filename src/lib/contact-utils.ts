/**
 * Storefront Merchant Public Contact Utilities
 * Safely resolves and formats merchant contact info while strictly preventing
 * platform admin, owner personal credentials, or dummy placeholders from leaking.
 */

import { formatPhoneNumber } from "@/lib/phone-utils";

// Known admin emails & platform owner test handles that must NEVER appear on merchant storefronts
const ADMIN_PERSONAL_EMAILS = new Set([
  "syed.ae018@gmail.com",
  "syedmustafa012006@gmail.com",
  "syed.5ae018@gmail.com",
  "admin@example.com",
  "test@example.com",
  "admin@kraftaura.in",
  "contact@kraftaura.in",
  "support@kraftaura.in",
]);

// Personal phone digits to filter out from merchant storefronts
const ADMIN_PERSONAL_PHONE_FRAGMENTS = ["7795811341", "9886866510"];

/**
 * Checks if a string is a dummy, nullish, or admin personal email
 */
export function isInvalidOrAdminEmail(email?: string | null): boolean {
  if (!email) return true;
  const clean = email.trim().toLowerCase();
  if (
    clean === "" ||
    clean === "undefined" ||
    clean === "null" ||
    clean === "none" ||
    clean === "n/a" ||
    clean.includes("example.com")
  ) {
    return true;
  }

  if (ADMIN_PERSONAL_EMAILS.has(clean)) return true;

  const envAdminEmails = process.env.ADMIN_EMAILS
    ? process.env.ADMIN_EMAILS.split(",").map((e) => e.trim().toLowerCase())
    : [];
  if (envAdminEmails.includes(clean)) return true;

  return false;
}

/**
 * Checks if a phone/whatsapp number is dummy, nullish, or admin personal number
 */
export function isInvalidOrAdminPhone(phone?: string | null): boolean {
  if (!phone) return true;
  const clean = phone.trim().toLowerCase();
  if (
    clean === "" ||
    clean === "undefined" ||
    clean === "null" ||
    clean === "none" ||
    clean === "n/a"
  ) {
    return true;
  }

  const digits = clean.replace(/\D/g, "");
  if (digits.length < 7) return true;

  for (const frag of ADMIN_PERSONAL_PHONE_FRAGMENTS) {
    if (digits.includes(frag)) return true;
  }

  return false;
}

/**
 * Checks if an address string is valid merchant address
 */
export function isInvalidAddress(address?: string | null): boolean {
  if (!address) return true;
  const clean = address.trim().toLowerCase();
  return (
    clean === "" ||
    clean === "undefined" ||
    clean === "null" ||
    clean === "none" ||
    clean === "n/a"
  );
}

/**
 * Sanitizes and generates valid social URL
 */
export function formatSocialUrl(
  handleOrUrl: string | undefined | null,
  platform: "instagram" | "facebook"
): string | null {
  if (!handleOrUrl) return null;
  const clean = handleOrUrl.trim();
  if (!clean || clean === "undefined" || clean === "null" || clean === "none") return null;

  if (clean.startsWith("http://") || clean.startsWith("https://")) {
    return clean;
  }

  const handle = clean.replace(/^@/, "").replace(/^\/+/, "");
  if (!handle) return null;

  if (platform === "instagram") {
    return `https://instagram.com/${handle}`;
  }
  if (platform === "facebook") {
    return `https://facebook.com/${handle}`;
  }
  return null;
}

export interface ResolvedMerchantContact {
  storeName: string;
  email: string | null;
  phone: string | null;
  formattedPhone: string | null;
  whatsapp: string | null;
  formattedWhatsapp: string | null;
  whatsappChatUrl: string | null;
  address: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  hasAnyDirectContact: boolean;
}

/**
 * Resolves safe public contact information for a specific store
 */
export function resolveStoreContact(
  store: {
    name: string;
    appearance?: { branding?: any };
    contact?: any;
    email?: string | null;
    whatsapp?: string | null;
    business_address?: string | null;
    instagram?: string | null;
    facebook?: string | null;
  }
): ResolvedMerchantContact {
  const branding = store.appearance?.branding || {};
  const directContact = store.contact || {};

  // Email
  const rawEmail = branding.email || directContact.email || store.email || null;
  const email = isInvalidOrAdminEmail(rawEmail) ? null : rawEmail.trim();

  // Phone (direct call)
  const rawPhone = branding.phone || directContact.phone || null;
  const phone = isInvalidOrAdminPhone(rawPhone) ? null : rawPhone.trim();
  const formattedPhone = phone ? formatPhoneNumber(phone) : null;

  // WhatsApp (ordering / customer chat)
  const rawWhatsapp =
    branding.whatsapp || directContact.whatsapp || store.whatsapp || null;
  const whatsapp = isInvalidOrAdminPhone(rawWhatsapp) ? null : rawWhatsapp.trim();
  const formattedWhatsapp = whatsapp ? formatPhoneNumber(whatsapp) : null;

  let whatsappChatUrl: string | null = null;
  if (whatsapp) {
    const cleanDigits = whatsapp.replace(/\D/g, "");
    const fullNumber = cleanDigits.length === 10 ? `91${cleanDigits}` : cleanDigits;
    const greeting = encodeURIComponent(
      `Hello ${store.name}, I have an inquiry about your products.`
    );
    whatsappChatUrl = `https://wa.me/${fullNumber}?text=${greeting}`;
  }

  // Address
  const rawAddress =
    branding.address || directContact.address || store.business_address || null;
  const address = isInvalidAddress(rawAddress) ? null : rawAddress.trim();

  // Social Links
  const rawInsta =
    branding.instagram || directContact.instagram || store.instagram || null;
  const instagramUrl = formatSocialUrl(rawInsta, "instagram");

  const rawFb =
    branding.facebook || directContact.facebook || store.facebook || null;
  const facebookUrl = formatSocialUrl(rawFb, "facebook");

  const hasAnyDirectContact = Boolean(
    email || phone || whatsapp || address || instagramUrl || facebookUrl
  );

  return {
    storeName: branding.name || store.name || "Our Store",
    email,
    phone,
    formattedPhone,
    whatsapp,
    formattedWhatsapp,
    whatsappChatUrl,
    address,
    instagramUrl,
    facebookUrl,
    hasAnyDirectContact,
  };
}
