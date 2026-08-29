/**
 * Kraftaura Curated Color Palettes
 * Four professionally designed, production-ready theme systems built around semantic tokens.
 */

import { CuratedPaletteId, ThemeTokens } from "@/types/theme";

export interface CuratedPaletteConfig {
  id: CuratedPaletteId;
  name: string;
  subtitle: string;
  style: string;
  bestFor: string;
  description: string;
  previewSwatches: {
    background: string;
    primary: string;
    accent: string;
    cta: string;
  };
  tokens: ThemeTokens;
}

/**
 * PALETTE 1 — MIDNIGHT LUXURY
 * High-end luxury fashion, jewellery, perfumes, boutique stores.
 */
export const MIDNIGHT_LUXURY_PALETTE: CuratedPaletteConfig = {
  id: "midnight-luxury",
  name: "Midnight Luxury",
  subtitle: "Deep Black • Warm Gold • Metallic",
  style: "Luxury, Elegant, High-End",
  bestFor: "Jewellery, Luxury Fashion, Perfumes, Premium Accessories",
  description: "Sophisticated deep black backdrop with champagne gold accents and warm white typography.",
  previewSwatches: {
    background: "#0B0B0C",
    primary: "#C9A96E",
    accent: "#E4C98A",
    cta: "#C9A96E",
  },
  tokens: {
    // Background
    background: "#0B0B0C",
    backgroundSecondary: "#111112",
    surface: "#151516",
    surfaceElevated: "#1E1E20",

    // Text
    textPrimary: "#F7F4EE",
    textSecondary: "#B9B5AC",
    textMuted: "#757168",
    textOnPrimary: "#0B0B0C",
    textOnAccent: "#0B0B0C",

    // Brand / Primary
    primary: "#C9A96E",
    primaryHover: "#B39255",
    primaryActive: "#9D7D40",
    primaryForeground: "#0B0B0C",

    // Secondary
    secondary: "#242220",
    secondaryHover: "#2E2B28",
    secondaryActive: "#3A3632",
    secondaryForeground: "#F7F4EE",

    // CTA
    cta: "#C9A96E",
    ctaHover: "#B39255",
    ctaActive: "#9D7D40",
    ctaForeground: "#0B0B0C",

    // Accent
    accent: "#E4C98A",
    accentHover: "#D4B774",
    accentForeground: "#0B0B0C",

    // Commerce / Product
    price: "#D8B878",
    priceDiscount: "#E4C98A",
    priceOriginal: "#757168",
    addToCart: "#C9A96E",
    addToCartHover: "#B39255",
    addToCartForeground: "#0B0B0C",
    buyNow: "#D8B878",
    buyNowForeground: "#0B0B0C",

    // Border / Dividers
    border: "#2B2925",
    borderStrong: "#423E37",
    divider: "#1F1E1B",

    // Status
    success: "#10B981",
    successForeground: "#FFFFFF",
    warning: "#F59E0B",
    warningForeground: "#0B0B0C",
    error: "#EF4444",
    errorForeground: "#FFFFFF",
    info: "#3B82F6",
    infoForeground: "#FFFFFF",
  },
};

/**
 * PALETTE 2 — WARM MAROON
 * Indian boutique, ethnic fashion, sarees, lehengas, handcrafted apparel.
 */
export const WARM_MAROON_PALETTE: CuratedPaletteConfig = {
  id: "warm-maroon",
  name: "Warm Maroon",
  subtitle: "Warm Cream • Rich Maroon • Gold Accent",
  style: "Warm, Elegant, Traditional-Modern",
  bestFor: "Sarees, Lehengas, Ethnic Fashion, Boutique Clothing, Handcrafts",
  description: "Inviting ivory surface with royal maroon buttons, warm charcoal typography and heritage gold highlights.",
  previewSwatches: {
    background: "#FFF9F5",
    primary: "#7A1028",
    accent: "#B88A3B",
    cta: "#8E1730",
  },
  tokens: {
    // Background
    background: "#FFF9F5",
    backgroundSecondary: "#F7EFE9",
    surface: "#FFFFFF",
    surfaceElevated: "#FBF3EE",

    // Text
    textPrimary: "#241A1C",
    textSecondary: "#6D6063",
    textMuted: "#9E9194",
    textOnPrimary: "#FFFFFF",
    textOnAccent: "#FFFFFF",

    // Brand / Primary
    primary: "#7A1028",
    primaryHover: "#641020",
    primaryActive: "#4E0C18",
    primaryForeground: "#FFFFFF",

    // Secondary
    secondary: "#F2E6DF",
    secondaryHover: "#E8D5CB",
    secondaryActive: "#DFC6B9",
    secondaryForeground: "#241A1C",

    // CTA
    cta: "#8E1730",
    ctaHover: "#751226",
    ctaActive: "#5D0D1E",
    ctaForeground: "#FFFFFF",

    // Accent
    accent: "#B88A3B",
    accentHover: "#A1762E",
    accentForeground: "#FFFFFF",

    // Commerce / Product
    price: "#7A1028",
    priceDiscount: "#B88A3B",
    priceOriginal: "#9E9194",
    addToCart: "#8E1730",
    addToCartHover: "#751226",
    addToCartForeground: "#FFFFFF",
    buyNow: "#7A1028",
    buyNowForeground: "#FFFFFF",

    // Border / Dividers
    border: "#E8DDE0",
    borderStrong: "#D4C2C6",
    divider: "#F0E7EA",

    // Status
    success: "#059669",
    successForeground: "#FFFFFF",
    warning: "#D97706",
    warningForeground: "#FFFFFF",
    error: "#DC2626",
    errorForeground: "#FFFFFF",
    info: "#2563EB",
    infoForeground: "#FFFFFF",
  },
};

/**
 * PALETTE 3 — OLIVE / NATURAL
 * Organic, natural skincare, sustainable home decor, artisan products.
 */
export const OLIVE_NATURAL_PALETTE: CuratedPaletteConfig = {
  id: "olive-natural",
  name: "Olive Natural",
  subtitle: "Natural Ivory • Forest Olive • Warm Bronze",
  style: "Organic, Earthy, Minimal, Artisan",
  bestFor: "Handmade, Organic Goods, Home Decor, Natural Skincare, Sustainable Products",
  description: "Subtle organic ground paired with soothing botanical olive greens, bronze accents and earthy neutrals.",
  previewSwatches: {
    background: "#F7F7F2",
    primary: "#536B3E",
    accent: "#A88A4A",
    cta: "#536B3E",
  },
  tokens: {
    // Background
    background: "#F7F7F2",
    backgroundSecondary: "#EDEEE6",
    surface: "#FFFFFF",
    surfaceElevated: "#F1F2EA",

    // Text
    textPrimary: "#1D211B",
    textSecondary: "#687064",
    textMuted: "#969E92",
    textOnPrimary: "#FFFFFF",
    textOnAccent: "#FFFFFF",

    // Brand / Primary
    primary: "#536B3E",
    primaryHover: "#455B33",
    primaryActive: "#374A27",
    primaryForeground: "#FFFFFF",

    // Secondary
    secondary: "#E6ECE0",
    secondaryHover: "#D8E2CF",
    secondaryActive: "#C9D8BD",
    secondaryForeground: "#1D211B",

    // CTA
    cta: "#536B3E",
    ctaHover: "#455B33",
    ctaActive: "#374A27",
    ctaForeground: "#FFFFFF",

    // Accent
    accent: "#A88A4A",
    accentHover: "#94783D",
    accentForeground: "#FFFFFF",

    // Commerce / Product
    price: "#536B3E",
    priceDiscount: "#A88A4A",
    priceOriginal: "#969E92",
    addToCart: "#536B3E",
    addToCartHover: "#455B33",
    addToCartForeground: "#FFFFFF",
    buyNow: "#3E522C",
    buyNowForeground: "#FFFFFF",

    // Border / Dividers
    border: "#DCE1D7",
    borderStrong: "#C4CCC0",
    divider: "#E9EDE6",

    // Status
    success: "#16A34A",
    successForeground: "#FFFFFF",
    warning: "#CA8A04",
    warningForeground: "#FFFFFF",
    error: "#DC2626",
    errorForeground: "#FFFFFF",
    info: "#2563EB",
    infoForeground: "#FFFFFF",
  },
};

/**
 * PALETTE 4 — CHARCOAL / ORANGE
 * Modern retail, electronics, lifestyle, contemporary catalog storefronts.
 */
export const CHARCOAL_ORANGE_PALETTE: CuratedPaletteConfig = {
  id: "charcoal-orange",
  name: "Charcoal Orange",
  subtitle: "Clean Neutral • Bold Charcoal • Vibrant Orange",
  style: "Modern, Bold, Energetic, Contemporary",
  bestFor: "Modern Retail, Electronics, Lifestyle, General-Purpose Stores",
  description: "High-contrast modern commerce aesthetic with strong charcoal structure and vibrant high-conversion orange.",
  previewSwatches: {
    background: "#F7F7F7",
    primary: "#202124",
    accent: "#F97316",
    cta: "#F97316",
  },
  tokens: {
    // Background
    background: "#F7F7F7",
    backgroundSecondary: "#EFEFEF",
    surface: "#FFFFFF",
    surfaceElevated: "#F0F0F0",

    // Text
    textPrimary: "#171717",
    textSecondary: "#666666",
    textMuted: "#999999",
    textOnPrimary: "#FFFFFF",
    textOnAccent: "#FFFFFF",

    // Brand / Primary
    primary: "#202124",
    primaryHover: "#111214",
    primaryActive: "#050506",
    primaryForeground: "#FFFFFF",

    // Secondary
    secondary: "#EEEEEE",
    secondaryHover: "#E0E0E0",
    secondaryActive: "#D4D4D4",
    secondaryForeground: "#202124",

    // CTA
    cta: "#F97316",
    ctaHover: "#EA580C",
    ctaActive: "#C2410C",
    ctaForeground: "#FFFFFF",

    // Accent
    accent: "#F97316",
    accentHover: "#EA580C",
    accentForeground: "#FFFFFF",

    // Commerce / Product
    price: "#EA580C",
    priceDiscount: "#F97316",
    priceOriginal: "#999999",
    addToCart: "#F97316",
    addToCartHover: "#EA580C",
    addToCartForeground: "#FFFFFF",
    buyNow: "#202124",
    buyNowForeground: "#FFFFFF",

    // Border / Dividers
    border: "#E5E5E5",
    borderStrong: "#CCCCCC",
    divider: "#EFEFEF",

    // Status
    success: "#16A34A",
    successForeground: "#FFFFFF",
    warning: "#D97706",
    warningForeground: "#FFFFFF",
    error: "#DC2626",
    errorForeground: "#FFFFFF",
    info: "#0284C7",
    infoForeground: "#FFFFFF",
  },
};

export const CURATED_PALETTES: Record<CuratedPaletteId, CuratedPaletteConfig> = {
  "midnight-luxury": MIDNIGHT_LUXURY_PALETTE,
  "warm-maroon": WARM_MAROON_PALETTE,
  "olive-natural": OLIVE_NATURAL_PALETTE,
  "charcoal-orange": CHARCOAL_ORANGE_PALETTE,
};

export const CURATED_PALETTES_LIST: CuratedPaletteConfig[] = [
  MIDNIGHT_LUXURY_PALETTE,
  WARM_MAROON_PALETTE,
  OLIVE_NATURAL_PALETTE,
  CHARCOAL_ORANGE_PALETTE,
];

export const DEFAULT_PALETTE_ID: CuratedPaletteId = "charcoal-orange";
