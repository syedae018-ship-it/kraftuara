/**
 * Centralized Legal Configuration & Versioning for Kraftaura
 * Used across frontend gating, backend action validation, and metadata storage.
 */

export const CURRENT_TERMS_VERSION = "terms_v1";
export const CURRENT_PRIVACY_VERSION = "privacy_v1";

export const TERMS_EFFECTIVE_DATE = "August 30, 2026";
export const TERMS_LAST_UPDATED = "August 30, 2026";

export const PRIVACY_EFFECTIVE_DATE = "August 30, 2026";
export const PRIVACY_LAST_UPDATED = "August 30, 2026";

export const LEGAL_CONTACT_EMAIL = "legal@kraftaura.in";
export const SUPPORT_CONTACT_EMAIL = "support@kraftaura.in";

export const TERMS_CANONICAL_URL = "https://www.kraftaura.in/terms";
export const PRIVACY_CANONICAL_URL = "https://www.kraftaura.in/privacy";

export interface TermsAcceptanceRecord {
  userId?: string;
  termsVersion: string;
  termsAccepted: boolean;
  acceptedTimestamp: string;
}

/**
 * Validates terms acceptance on submission
 */
export function validateTermsAcceptance(
  accepted: boolean | string | null | undefined,
  version?: string | null
): { isValid: boolean; error?: string } {
  const isAccepted =
    accepted === true ||
    accepted === "true" ||
    accepted === "on" ||
    accepted === "1";

  if (!isAccepted) {
    return {
      isValid: false,
      error: "Please accept the Terms & Conditions to create your account.",
    };
  }

  // Version matching check (if version was provided)
  if (version && version !== CURRENT_TERMS_VERSION) {
    return {
      isValid: false,
      error: "The Terms & Conditions have been updated. Please review and accept the latest version.",
    };
  }

  return { isValid: true };
}
