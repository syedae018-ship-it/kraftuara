/**
 * Kraftaura Centralized Phone Number Utilities
 * Defaults to India (+91) everywhere across the platform.
 */

export interface CountryDialCode {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
  placeholder: string;
  nationalDigits: number;
}

export const SUPPORTED_COUNTRIES: CountryDialCode[] = [
  { code: "IN", name: "India", dialCode: "+91", flag: "🇮🇳", placeholder: "98765 43210", nationalDigits: 10 },
  { code: "US", name: "United States", dialCode: "+1", flag: "🇺🇸", placeholder: "202 555 0123", nationalDigits: 10 },
  { code: "GB", name: "United Kingdom", dialCode: "+44", flag: "🇬🇧", placeholder: "7911 123456", nationalDigits: 10 },
  { code: "AE", name: "United Arab Emirates", dialCode: "+971", flag: "🇦🇪", placeholder: "50 123 4567", nationalDigits: 9 },
  { code: "SG", name: "Singapore", dialCode: "+65", flag: "🇸🇬", placeholder: "8123 4567", nationalDigits: 8 },
  { code: "SA", name: "Saudi Arabia", dialCode: "+966", flag: "🇸🇦", placeholder: "50 123 4567", nationalDigits: 9 },
  { code: "CA", name: "Canada", dialCode: "+1", flag: "🇨🇦", placeholder: "416 555 0123", nationalDigits: 10 },
  { code: "AU", name: "Australia", dialCode: "+61", flag: "🇦🇺", placeholder: "412 345 678", nationalDigits: 9 },
  { code: "MY", name: "Malaysia", dialCode: "+60", flag: "🇲🇾", placeholder: "12 345 6789", nationalDigits: 9 },
  { code: "KW", name: "Kuwait", dialCode: "+965", flag: "🇰🇼", placeholder: "9123 4567", nationalDigits: 8 },
  { code: "QA", name: "Qatar", dialCode: "+974", flag: "🇶🇦", placeholder: "3312 3456", nationalDigits: 8 },
  { code: "OM", name: "Oman", dialCode: "+968", flag: "🇴🇲", placeholder: "9123 4567", nationalDigits: 8 },
];

export const DEFAULT_COUNTRY = SUPPORTED_COUNTRIES[0]; // India (+91)

/**
 * Normalizes any phone number into canonical international format: +<dialCode><digits>.
 * Defaults to India (+91) for 10-digit Indian numbers without dial code.
 * Prevents duplicate country codes like +91+91 or 9191.
 */
export function normalizePhoneNumber(
  rawInput?: string | null,
  defaultDialCode = "+91"
): string {
  if (!rawInput) return "";
  
  let cleaned = rawInput.trim();
  if (!cleaned) return "";

  // Remove whitespace, dashes, parentheses, dots
  cleaned = cleaned.replace(/[\s\-\(\)\.]/g, "");

  // Prevent multiple plus signs
  if (cleaned.startsWith("++")) {
    cleaned = "+" + cleaned.replace(/^\++/, "");
  }

  // Handle double country code prefix like +91+91...
  cleaned = cleaned.replace(/^\+91\+91/, "+91");
  cleaned = cleaned.replace(/^\+1\+1/, "+1");
  cleaned = cleaned.replace(/^\+44\+44/, "+44");
  cleaned = cleaned.replace(/^\+971\+971/, "+971");

  // If already starts with '+', validate and return
  if (cleaned.startsWith("+")) {
    const digitsOnly = cleaned.substring(1).replace(/[^0-9]/g, "");
    return digitsOnly ? `+${digitsOnly}` : "";
  }

  // If starts with '00', convert international format to '+'
  if (cleaned.startsWith("00")) {
    const digitsOnly = cleaned.substring(2).replace(/[^0-9]/g, "");
    return digitsOnly ? `+${digitsOnly}` : "";
  }

  const digits = cleaned.replace(/[^0-9]/g, "");
  if (!digits) return "";

  // If starts with leading '0' (standard Indian mobile format e.g. 09876543210), strip 0 and apply default +91
  if (digits.startsWith("0") && digits.length === 11) {
    return `${defaultDialCode}${digits.substring(1)}`;
  }

  // If starts with '91' and is 12 digits (India international without +), prepend +
  if (digits.startsWith("91") && digits.length === 12) {
    return `+${digits}`;
  }

  // If starts with '1' and is 11 digits (US/CA international without +), prepend +
  if (digits.startsWith("1") && digits.length === 11) {
    return `+${digits}`;
  }

  // If 10 digits (Standard Indian mobile number), prepend +91
  if (digits.length === 10) {
    return `${defaultDialCode}${digits}`;
  }

  // If standard digits without +, prepend default country dial code
  return `${defaultDialCode}${digits}`;
}

/**
 * Splits a stored or entered phone number into countryCode and nationalNumber.
 */
export function splitPhoneNumber(
  rawInput?: string | null,
  defaultDialCode = "+91"
): { countryCode: string; nationalNumber: string } {
  if (!rawInput) {
    return { countryCode: defaultDialCode, nationalNumber: "" };
  }

  let cleaned = rawInput.trim();
  // Strip duplicate plus signs if any
  cleaned = cleaned.replace(/^\++/, "+");

  // Check known country dial codes
  for (const country of SUPPORTED_COUNTRIES) {
    if (cleaned.startsWith(country.dialCode)) {
      const national = cleaned.substring(country.dialCode.length).replace(/[^0-9]/g, "");
      return { countryCode: country.dialCode, nationalNumber: national };
    }
  }

  // Check dial code without leading '+' (e.g. '919876543210')
  for (const country of SUPPORTED_COUNTRIES) {
    const rawCode = country.dialCode.replace("+", "");
    if (cleaned.startsWith(rawCode) && cleaned.length > rawCode.length + 6) {
      const national = cleaned.substring(rawCode.length).replace(/[^0-9]/g, "");
      return { countryCode: country.dialCode, nationalNumber: national };
    }
  }

  // Check if starts with leading 0
  const digits = cleaned.replace(/[^0-9]/g, "");
  if (digits.startsWith("0") && digits.length === 11) {
    return { countryCode: defaultDialCode, nationalNumber: digits.substring(1) };
  }

  // Default fallback: return all digits as national number with default dial code
  return { countryCode: defaultDialCode, nationalNumber: digits };
}

/**
 * Formats a canonical or raw phone number for clean UI display: e.g. "+91 98765 43210".
 */
export function formatPhoneNumber(rawInput?: string | null): string {
  if (!rawInput) return "";

  const { countryCode, nationalNumber } = splitPhoneNumber(rawInput);
  if (!nationalNumber) return "";

  // Format 10-digit numbers into 5-5 chunk (e.g. 98765 43210)
  if (nationalNumber.length === 10) {
    const part1 = nationalNumber.slice(0, 5);
    const part2 = nationalNumber.slice(5);
    return `${countryCode} ${part1} ${part2}`;
  }

  // Format other lengths cleanly
  if (nationalNumber.length > 5) {
    const part1 = nationalNumber.slice(0, Math.ceil(nationalNumber.length / 2));
    const part2 = nationalNumber.slice(Math.ceil(nationalNumber.length / 2));
    return `${countryCode} ${part1} ${part2}`;
  }

  return `${countryCode} ${nationalNumber}`;
}

/**
 * Validates whether the given phone input represents a valid mobile number.
 * For India (+91), expects 10 digits starting with 6, 7, 8, or 9.
 */
export function isValidPhoneNumber(rawInput?: string | null): boolean {
  if (!rawInput) return false;

  const { countryCode, nationalNumber } = splitPhoneNumber(rawInput);
  if (!nationalNumber) return false;

  if (countryCode === "+91") {
    // Indian mobile numbers must be 10 digits and start with 6, 7, 8, or 9
    return /^[6-9]\d{9}$/.test(nationalNumber);
  }

  // General international validation (7 to 15 digits)
  return nationalNumber.length >= 7 && nationalNumber.length <= 15;
}

/**
 * Extracts digits-only for WhatsApp URL generation: e.g. `https://wa.me/919876543210`.
 * Always uses the normalized international number.
 */
export function getWhatsAppDestination(rawInput?: string | null): string {
  if (!rawInput) return "";
  const normalized = normalizePhoneNumber(rawInput);
  return normalized.replace(/[^0-9]/g, "");
}
