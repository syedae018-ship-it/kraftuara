/**
 * Kraftaura Master Theme Token Resolver
 * Single Source of Truth for Store Theme Tokens & CSS Custom Properties
 * 
 * Flow:
 * CURATED PALETTE -> SEMANTIC TOKENS -> OPTIONAL CUSTOM OVERRIDES -> CONTRAST VALIDATION -> FINAL THEME -> STOREFRONT COMPONENTS
 */

import { AppearanceSettings, CuratedPaletteId, ThemeTokens, ThemeColors } from "@/types/theme";
import {
  CURATED_PALETTES,
  DEFAULT_PALETTE_ID,
} from "./theme-palettes";
import {
  normalizeHex,
  getOptimalForeground,
  adjustLightness,
  validateTokenContrast,
} from "./color-utils";
import { getFontStack } from "./typography-utils";

export interface ResolvedTheme {
  paletteId: CuratedPaletteId;
  tokens: ThemeTokens;
  cssVariables: Record<string, string>;
  styleObject: React.CSSProperties;
  contrastIssues: { pair: string; ratio: number; isSufficient: boolean; message?: string }[];
}

/**
 * Identifies the best-matching curated palette ID from paletteId or legacy colors.
 */
export function identifyPaletteId(appearance?: Partial<AppearanceSettings> | null): CuratedPaletteId {
  if (appearance?.paletteId && appearance.paletteId in CURATED_PALETTES) {
    return appearance.paletteId as CuratedPaletteId;
  }

  const primary = normalizeHex(appearance?.colors?.primary || "");
  const bg = normalizeHex(appearance?.colors?.background || "");

  if (primary === "#C9A96E" || bg === "#0B0B0C" || bg === "#080808" || appearance?.themeId === "luxury") {
    return "midnight-luxury";
  }
  if (primary === "#7A1028" || primary === "#800020" || bg === "#FFF9F5") {
    return "warm-maroon";
  }
  if (primary === "#536B3E" || primary === "#4A5D36" || bg === "#F7F7F2") {
    return "olive-natural";
  }

  return DEFAULT_PALETTE_ID;
}

/**
 * Master theme resolver: takes appearance settings and computes the full, deterministic
 * set of semantic design tokens with guaranteed-visible foregrounds and hover/active states.
 */
export function resolveThemeTokens(appearance?: Partial<AppearanceSettings> | null): ResolvedTheme {
  const paletteId = identifyPaletteId(appearance);
  const basePalette = CURATED_PALETTES[paletteId] || CURATED_PALETTES[DEFAULT_PALETTE_ID];
  const baseTokens = { ...basePalette.tokens };

  // Explicit persisted tokens and custom single-token overrides
  const persistedTokens: Partial<ThemeTokens> = appearance?.tokens || {};
  const customOverrides: Partial<ThemeTokens> = appearance?.customOverrides || {};

  // Support legacy colors only as fallback if neither customOverrides nor tokens provided for that key
  const legacyColors: Partial<ThemeColors> = appearance?.colors || {};

  const rawPrimary = customOverrides.primary || persistedTokens.primary || legacyColors.primary || baseTokens.primary;
  const rawSecondary = customOverrides.secondary || persistedTokens.secondary || legacyColors.secondary || baseTokens.secondary;
  const rawAccent = customOverrides.accent || persistedTokens.accent || legacyColors.accent || baseTokens.accent;
  const rawBackground = customOverrides.background || persistedTokens.background || legacyColors.background || baseTokens.background;

  const rawSurface = customOverrides.surface || persistedTokens.surface || baseTokens.surface;
  const rawTextPrimary = customOverrides.textPrimary || persistedTokens.textPrimary || baseTokens.textPrimary;
  const rawTextSecondary = customOverrides.textSecondary || persistedTokens.textSecondary || baseTokens.textSecondary;
  const rawCta = customOverrides.cta || persistedTokens.cta || baseTokens.cta;
  const rawAddToCart = customOverrides.addToCart || persistedTokens.addToCart || baseTokens.addToCart;
  const rawPrice = customOverrides.price || persistedTokens.price || baseTokens.price;

  // Normalize all hex values
  const normalizedPrimary = normalizeHex(rawPrimary, baseTokens.primary);
  const normalizedSecondary = normalizeHex(rawSecondary, baseTokens.secondary);
  const normalizedAccent = normalizeHex(rawAccent, baseTokens.accent);
  const normalizedBackground = normalizeHex(rawBackground, baseTokens.background);

  const normalizedSurface = normalizeHex(rawSurface, baseTokens.surface);
  const normalizedTextPrimary = normalizeHex(rawTextPrimary, baseTokens.textPrimary);
  const normalizedTextSecondary = normalizeHex(rawTextSecondary, baseTokens.textSecondary);
  const normalizedCta = normalizeHex(rawCta, baseTokens.cta);
  const normalizedAddToCart = normalizeHex(rawAddToCart, baseTokens.addToCart);
  const normalizedPrice = normalizeHex(rawPrice, baseTokens.price);

  const normalized: ThemeTokens = {
    // 1. Backgrounds & Surfaces
    background: normalizedBackground,
    backgroundSecondary: normalizeHex(customOverrides.backgroundSecondary || persistedTokens.backgroundSecondary, adjustLightness(normalizedBackground, 0.04)),
    surface: normalizedSurface,
    surfaceElevated: normalizeHex(customOverrides.surfaceElevated || persistedTokens.surfaceElevated, adjustLightness(normalizedSurface, 0.05)),

    // 2. Typography
    textPrimary: normalizedTextPrimary,
    textSecondary: normalizedTextSecondary,
    textMuted: normalizeHex(customOverrides.textMuted || persistedTokens.textMuted, adjustLightness(normalizedTextSecondary, -0.15)),
    textOnPrimary: getOptimalForeground(normalizedPrimary),
    textOnAccent: getOptimalForeground(normalizedAccent),

    // 3. Primary Accent (Brand & Active Navigation)
    primary: normalizedPrimary,
    primaryHover: normalizeHex(customOverrides.primaryHover || persistedTokens.primaryHover, adjustLightness(normalizedPrimary, -0.1)),
    primaryActive: normalizeHex(customOverrides.primaryActive || persistedTokens.primaryActive, adjustLightness(normalizedPrimary, -0.18)),
    primaryForeground: getOptimalForeground(normalizedPrimary),

    // 4. Secondary Accent (Secondary Buttons & Subtle Surfaces)
    secondary: normalizedSecondary,
    secondaryHover: normalizeHex(customOverrides.secondaryHover || persistedTokens.secondaryHover, adjustLightness(normalizedSecondary, -0.06)),
    secondaryActive: normalizeHex(customOverrides.secondaryActive || persistedTokens.secondaryActive, adjustLightness(normalizedSecondary, -0.12)),
    secondaryForeground: getOptimalForeground(normalizedSecondary),

    // 5. Highlight / Accent (Promotional Badges & Emphasis)
    accent: normalizedAccent,
    accentHover: normalizeHex(customOverrides.accentHover || persistedTokens.accentHover, adjustLightness(normalizedAccent, -0.1)),
    accentForeground: getOptimalForeground(normalizedAccent),

    // 6. Commerce Actions (CTA & Add to Cart)
    cta: normalizedCta,
    ctaHover: normalizeHex(customOverrides.ctaHover || persistedTokens.ctaHover, adjustLightness(normalizedCta, -0.1)),
    ctaActive: normalizeHex(customOverrides.ctaActive || persistedTokens.ctaActive, adjustLightness(normalizedCta, -0.18)),
    ctaForeground: getOptimalForeground(normalizedCta),

    addToCart: normalizedAddToCart,
    addToCartHover: normalizeHex(customOverrides.addToCartHover || persistedTokens.addToCartHover, adjustLightness(normalizedAddToCart, -0.1)),
    addToCartForeground: getOptimalForeground(normalizedAddToCart),

    buyNow: normalizedCta,
    buyNowForeground: getOptimalForeground(normalizedCta),

    // 7. Pricing
    price: normalizedPrice,
    priceDiscount: normalizedPrice,
    priceOriginal: normalizeHex(customOverrides.priceOriginal || persistedTokens.priceOriginal, adjustLightness(normalizedTextSecondary, -0.1)),

    // 8. Borders & Dividers
    border: normalizeHex(customOverrides.border || persistedTokens.border, baseTokens.border),
    borderStrong: normalizeHex(customOverrides.borderStrong || persistedTokens.borderStrong, baseTokens.borderStrong),
    divider: normalizeHex(customOverrides.divider || persistedTokens.divider, baseTokens.divider),

    // 9. Status Indicators
    success: normalizeHex(customOverrides.success || persistedTokens.success, baseTokens.success),
    successForeground: "#FFFFFF",
    warning: normalizeHex(customOverrides.warning || persistedTokens.warning, baseTokens.warning),
    warningForeground: getOptimalForeground(baseTokens.warning),
    error: normalizeHex(customOverrides.error || persistedTokens.error, baseTokens.error),
    errorForeground: "#FFFFFF",
    info: normalizeHex(customOverrides.info || persistedTokens.info, baseTokens.info),
    infoForeground: "#FFFFFF",
  };

  // Typography font stacks
  const headingFont = appearance?.typography?.headingFont || "Plus Jakarta Sans";
  const bodyFont = appearance?.typography?.bodyFont || "Inter";

  // Generate CSS custom properties
  const cssVariables: Record<string, string> = {
    // 1. Storefront Background
    "--color-background": normalized.background,
    "--color-background-secondary": normalized.backgroundSecondary,
    "--bloom-background": normalized.background,

    // 2. Surface & Cards
    "--color-surface": normalized.surface,
    "--color-surface-elevated": normalized.surfaceElevated,
    "--bloom-card": normalized.surface,

    // 3. Text Primary (Headings)
    "--color-text-primary": normalized.textPrimary,
    "--bloom-foreground": normalized.textPrimary,

    // 4. Text Secondary (Body)
    "--color-text-secondary": normalized.textSecondary,
    "--color-text-muted": normalized.textMuted,
    "--bloom-muted": normalized.textSecondary,

    // 5. Primary Accent
    "--color-primary": normalized.primary,
    "--color-primary-hover": normalized.primaryHover,
    "--color-primary-active": normalized.primaryActive,
    "--color-primary-foreground": normalized.primaryForeground,
    "--bloom-primary": normalized.primary,
    "--bloom-primary-foreground": normalized.primaryForeground,

    // 6. Secondary Accent
    "--color-secondary": normalized.secondary,
    "--color-secondary-hover": normalized.secondaryHover,
    "--color-secondary-active": normalized.secondaryActive,
    "--color-secondary-foreground": normalized.secondaryForeground,
    "--bloom-secondary": normalized.secondary,

    // 7. Highlight / Accent
    "--color-accent": normalized.accent,
    "--color-accent-hover": normalized.accentHover,
    "--color-accent-foreground": normalized.accentForeground,
    "--bloom-accent": `${normalized.accent}18`,

    // 8. CTA Color (Buy / Action)
    "--color-cta": normalized.cta,
    "--color-cta-hover": normalized.ctaHover,
    "--color-cta-active": normalized.ctaActive,
    "--color-cta-foreground": normalized.ctaForeground,
    "--color-buy-now": normalized.cta,
    "--color-buy-now-foreground": normalized.ctaForeground,

    // 9. Add to Cart Color
    "--color-add-to-cart": normalized.addToCart,
    "--color-add-to-cart-hover": normalized.addToCartHover,
    "--color-add-to-cart-foreground": normalized.addToCartForeground,

    // 10. Price Color
    "--color-price": normalized.price,
    "--color-price-discount": normalized.priceDiscount,
    "--color-price-original": normalized.priceOriginal,

    // Borders & UI
    "--color-border": normalized.border,
    "--color-border-strong": normalized.borderStrong,
    "--color-divider": normalized.divider,
    "--bloom-border": normalized.border,

    // Status
    "--color-success": normalized.success,
    "--color-success-foreground": normalized.successForeground,
    "--color-warning": normalized.warning,
    "--color-warning-foreground": normalized.warningForeground,
    "--color-error": normalized.error,
    "--color-error-foreground": normalized.errorForeground,
    "--color-info": normalized.info,
    "--color-info-foreground": normalized.infoForeground,

    // Typography
    "--font-heading": getFontStack(headingFont),
    "--font-body": getFontStack(bodyFont),
    "fontFamily": "var(--font-body)",
  };

  const contrastIssues = validateTokenContrast(normalized);

  return {
    paletteId,
    tokens: normalized,
    cssVariables,
    styleObject: cssVariables as unknown as React.CSSProperties,
    contrastIssues,
  };
}
