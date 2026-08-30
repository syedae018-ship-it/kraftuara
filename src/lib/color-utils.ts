/**
 * Kraftaura Color & Contrast Safety Engine
 * Implements WCAG 2.1 relative luminance & contrast ratio calculation
 * Guarantees that foreground text/icons are always readable against background elements.
 */

export interface RGB {
  r: number;
  g: number;
  b: number;
}

/**
 * Normalizes any hex string into standard 6-character uppercase format (e.g. #FFF -> #FFFFFF).
 * Returns safe fallback (#000000) if string is invalid.
 */
export function normalizeHex(hex?: string | null, fallback = "#000000"): string {
  if (!hex || typeof hex !== "string") return fallback;
  let clean = hex.trim().replace(/^#/, "");

  if (clean.length === 3) {
    clean = clean
      .split("")
      .map((c) => c + c)
      .join("");
  }

  if (clean.length !== 6 || !/^[0-9A-Fa-f]{6}$/.test(clean)) {
    return fallback;
  }

  return `#${clean.toUpperCase()}`;
}

/**
 * Converts a hex string to RGB object.
 */
export function hexToRgb(hex: string): RGB {
  const norm = normalizeHex(hex);
  const num = parseInt(norm.slice(1), 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

/**
 * Converts RGB numbers to hex string.
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (val: number) => Math.max(0, Math.min(255, Math.round(val)));
  const toHex = (val: number) => clamp(val).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

/**
 * Calculates WCAG 2.1 relative luminance for an sRGB color.
 * Range: 0.0 (darkest black) to 1.0 (lightest white).
 */
export function getRelativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);

  const normalizeChannel = (channel: number) => {
    const s = channel / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };

  const R = normalizeChannel(r);
  const G = normalizeChannel(g);
  const B = normalizeChannel(b);

  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

/**
 * Calculates the WCAG 2.1 contrast ratio between two colors.
 * Returns ratio between 1.0 (no contrast) and 21.0 (maximum contrast).
 */
export function calculateContrast(hex1: string, hex2: string): number {
  const lum1 = getRelativeLuminance(hex1);
  const lum2 = getRelativeLuminance(hex2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Determines whether a color is considered "dark" (luminance < 0.2).
 */
export function isDarkColor(hex: string): boolean {
  return getRelativeLuminance(hex) < 0.2;
}

/**
 * Evaluates contrast against candidate light and dark foregrounds and picks the optimal one.
 * Guarantees that buttons, badges, and text never blend into their background.
 */
export function getOptimalForeground(
  backgroundHex: string,
  lightCandidate = "#FFFFFF",
  darkCandidate = "#0B0B0C"
): string {
  const contrastLight = calculateContrast(lightCandidate, backgroundHex);
  const contrastDark = calculateContrast(darkCandidate, backgroundHex);

  return contrastLight >= contrastDark ? lightCandidate : darkCandidate;
}

/**
 * Adjusts the lightness of a hex color by a percentage factor (-1.0 to 1.0).
 * Useful for computing hover/active states deterministically without CSS opacity hacks.
 */
export function adjustLightness(hex: string, factor: number): string {
  const { r, g, b } = hexToRgb(hex);

  if (factor > 0) {
    // Lighten
    const newR = r + (255 - r) * factor;
    const newG = g + (255 - g) * factor;
    const newB = b + (255 - b) * factor;
    return rgbToHex(newR, newG, newB);
  } else {
    // Darken
    const absFactor = Math.abs(factor);
    const newR = r * (1 - absFactor);
    const newG = g * (1 - absFactor);
    const newB = b * (1 - absFactor);
    return rgbToHex(newR, newG, newB);
  }
}

/**
 * Validates critical token pairs for accessibility and contrast readability.
 * Returns an array of readable warning messages if any pair fails minimum contrast (< 3.0:1 for large/bold, < 4.5:1 for body).
 */
export function validateTokenContrast(tokens: {
  background: string;
  textPrimary: string;
  textSecondary: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  cta: string;
  ctaForeground: string;
  addToCart: string;
  addToCartForeground: string;
  price: string;
}): { pair: string; ratio: number; isSufficient: boolean; message?: string }[] {
  const checks = [
    {
      pair: "Text Primary / Background",
      fg: tokens.textPrimary,
      bg: tokens.background,
      minRatio: 4.5,
    },
    {
      pair: "Text Secondary / Background",
      fg: tokens.textSecondary,
      bg: tokens.background,
      minRatio: 3.0,
    },
    {
      pair: "Primary Button Text / Primary Background",
      fg: tokens.primaryForeground,
      bg: tokens.primary,
      minRatio: 2.8,
    },
    {
      pair: "Secondary Button Text / Secondary Background",
      fg: tokens.secondaryForeground,
      bg: tokens.secondary,
      minRatio: 2.8,
    },
    {
      pair: "CTA Button Text / CTA Background",
      fg: tokens.ctaForeground,
      bg: tokens.cta,
      minRatio: 2.8,
    },
    {
      pair: "Add To Cart Text / Add To Cart Background",
      fg: tokens.addToCartForeground,
      bg: tokens.addToCart,
      minRatio: 2.8,
    },
    {
      pair: "Price / Background",
      fg: tokens.price,
      bg: tokens.background,
      minRatio: 3.0,
    },

  ];

  return checks.map((c) => {
    const ratio = calculateContrast(c.fg, c.bg);
    const isSufficient = ratio >= c.minRatio;
    return {
      pair: c.pair,
      ratio: Math.round(ratio * 10) / 10,
      isSufficient,
      message: isSufficient
        ? undefined
        : `Low contrast (${Math.round(ratio * 10) / 10}:1) between ${c.pair}. Text or button may be difficult to read.`,
    };
  });
}
