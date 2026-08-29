/**
 * Kraftaura Master Theme Token Resolver
 * Single Source of Truth for Store Theme Tokens & CSS Custom Properties
 * 
 * Flow:
 * CURATED PALETTE -> SEMANTIC TOKENS -> OPTIONAL CUSTOM OVERRIDES -> CONTRAST VALIDATION -> FINAL THEME -> STOREFRONT COMPONENTS
 */

import { AppearanceSettings, CuratedPaletteId, ThemeTokens } from "@/types/theme";
import {
  CURATED_PALETTES,
  DEFAULT_PALETTE_ID,
  CURATED_PALETTES_LIST,
} from "./theme-palettes";
import {
  normalizeHex,
  getOptimalForeground,
  adjustLightness,
  validateTokenContrast,
} from "./color-utils";
import { getFontStack } from "@/components/appearance/typography-picker";

export interface ResolvedTheme {
  paletteId: CuratedPaletteId;
  tokens: ThemeTokens;
  cssVariables: Record<string, string>;
  styleObject: React.CSSProperties;
  contrastIssues: { pair: string; ratio: number; isSufficient: boolean; message?: string }[];
}

/**
 * Identifies the best-matching curated palette ID from legacy 4-hex colors or stored paletteId.
 */
export function identifyPaletteId(appearance?: Partial<AppearanceSettings> | null): CuratedPaletteId {
  if (appearance?.paletteId && appearance.paletteId in CURATED_PALETTES) {
    return appearance.paletteId as CuratedPaletteId;
  }

  // Check if legacy theme colors match any curated palette
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

  // Apply custom overrides
  const customOverrides = appearance?.customOverrides || {};

  // Also support legacy colors as overrides if explicitly different from base
  const legacyColors = appearance?.colors;
  const legacyOverrides: Partial<ThemeTokens> = {};
  if (legacyColors) {
    if (legacyColors.background && legacyColors.background !== basePalette.previewSwatches.background) {
      legacyOverrides.background = normalizeHex(legacyColors.background);
      legacyOverrides.surface = normalizeHex(legacyColors.background);
    }
    if (legacyColors.primary && legacyColors.primary !== basePalette.previewSwatches.primary) {
      legacyOverrides.primary = normalizeHex(legacyColors.primary);
      legacyOverrides.textPrimary = normalizeHex(legacyColors.primary);
    }
    if (legacyColors.accent && legacyColors.accent !== basePalette.previewSwatches.accent) {
      legacyOverrides.accent = normalizeHex(legacyColors.accent);
      legacyOverrides.cta = normalizeHex(legacyColors.accent);
      legacyOverrides.addToCart = normalizeHex(legacyColors.accent);
      legacyOverrides.price = normalizeHex(legacyColors.accent);
    }
    if (legacyColors.secondary && legacyColors.secondary !== baseTokens.secondary) {
      legacyOverrides.secondary = normalizeHex(legacyColors.secondary);
    }
  }

  // Merge: Base Palette -> Legacy Overrides -> Explicit Custom Overrides
  const rawMerged: ThemeTokens = {
    ...baseTokens,
    ...legacyOverrides,
    ...customOverrides,
  };

  // Normalize all hex values
  const normalized: ThemeTokens = {
    background: normalizeHex(rawMerged.background, baseTokens.background),
    backgroundSecondary: normalizeHex(rawMerged.backgroundSecondary, baseTokens.backgroundSecondary),
    surface: normalizeHex(rawMerged.surface, baseTokens.surface),
    surfaceElevated: normalizeHex(rawMerged.surfaceElevated, baseTokens.surfaceElevated),

    textPrimary: normalizeHex(rawMerged.textPrimary, baseTokens.textPrimary),
    textSecondary: normalizeHex(rawMerged.textSecondary, baseTokens.textSecondary),
    textMuted: normalizeHex(rawMerged.textMuted, baseTokens.textMuted),
    textOnPrimary: normalizeHex(rawMerged.textOnPrimary, getOptimalForeground(rawMerged.primary)),
    textOnAccent: normalizeHex(rawMerged.textOnAccent, getOptimalForeground(rawMerged.accent)),

    primary: normalizeHex(rawMerged.primary, baseTokens.primary),
    primaryHover: normalizeHex(rawMerged.primaryHover, adjustLightness(rawMerged.primary, -0.1)),
    primaryActive: normalizeHex(rawMerged.primaryActive, adjustLightness(rawMerged.primary, -0.18)),
    primaryForeground: normalizeHex(rawMerged.primaryForeground, getOptimalForeground(rawMerged.primary)),

    secondary: normalizeHex(rawMerged.secondary, baseTokens.secondary),
    secondaryHover: normalizeHex(rawMerged.secondaryHover, adjustLightness(rawMerged.secondary, -0.05)),
    secondaryActive: normalizeHex(rawMerged.secondaryActive, adjustLightness(rawMerged.secondary, -0.1)),
    secondaryForeground: normalizeHex(rawMerged.secondaryForeground, getOptimalForeground(rawMerged.secondary)),

    cta: normalizeHex(rawMerged.cta, baseTokens.cta),
    ctaHover: normalizeHex(rawMerged.ctaHover, adjustLightness(rawMerged.cta, -0.1)),
    ctaActive: normalizeHex(rawMerged.ctaActive, adjustLightness(rawMerged.cta, -0.18)),
    ctaForeground: normalizeHex(rawMerged.ctaForeground, getOptimalForeground(rawMerged.cta)),

    accent: normalizeHex(rawMerged.accent, baseTokens.accent),
    accentHover: normalizeHex(rawMerged.accentHover, adjustLightness(rawMerged.accent, -0.1)),
    accentForeground: normalizeHex(rawMerged.accentForeground, getOptimalForeground(rawMerged.accent)),

    price: normalizeHex(rawMerged.price, baseTokens.price),
    priceDiscount: normalizeHex(rawMerged.priceDiscount, baseTokens.priceDiscount),
    priceOriginal: normalizeHex(rawMerged.priceOriginal, baseTokens.priceOriginal),
    addToCart: normalizeHex(rawMerged.addToCart, baseTokens.addToCart),
    addToCartHover: normalizeHex(rawMerged.addToCartHover, adjustLightness(rawMerged.addToCart, -0.1)),
    addToCartForeground: normalizeHex(rawMerged.addToCartForeground, getOptimalForeground(rawMerged.addToCart)),
    buyNow: normalizeHex(rawMerged.buyNow, baseTokens.buyNow),
    buyNowForeground: normalizeHex(rawMerged.buyNowForeground, getOptimalForeground(rawMerged.buyNow)),

    border: normalizeHex(rawMerged.border, baseTokens.border),
    borderStrong: normalizeHex(rawMerged.borderStrong, baseTokens.borderStrong),
    divider: normalizeHex(rawMerged.divider, baseTokens.divider),

    success: normalizeHex(rawMerged.success, baseTokens.success),
    successForeground: normalizeHex(rawMerged.successForeground, "#FFFFFF"),
    warning: normalizeHex(rawMerged.warning, baseTokens.warning),
    warningForeground: normalizeHex(rawMerged.warningForeground, getOptimalForeground(rawMerged.warning)),
    error: normalizeHex(rawMerged.error, baseTokens.error),
    errorForeground: normalizeHex(rawMerged.errorForeground, "#FFFFFF"),
    info: normalizeHex(rawMerged.info, baseTokens.info),
    infoForeground: normalizeHex(rawMerged.infoForeground, "#FFFFFF"),
  };

  // Typography font stacks
  const headingFont = appearance?.typography?.headingFont || "Plus Jakarta Sans";
  const bodyFont = appearance?.typography?.bodyFont || "Inter";

  // Generate CSS custom properties
  const cssVariables: Record<string, string> = {
    // Semantic Tokens
    "--color-background": normalized.background,
    "--color-background-secondary": normalized.backgroundSecondary,
    "--color-surface": normalized.surface,
    "--color-surface-elevated": normalized.surfaceElevated,

    "--color-text-primary": normalized.textPrimary,
    "--color-text-secondary": normalized.textSecondary,
    "--color-text-muted": normalized.textMuted,
    "--color-text-on-primary": normalized.textOnPrimary,
    "--color-text-on-accent": normalized.textOnAccent,

    "--color-primary": normalized.primary,
    "--color-primary-hover": normalized.primaryHover,
    "--color-primary-active": normalized.primaryActive,
    "--color-primary-foreground": normalized.primaryForeground,

    "--color-secondary": normalized.secondary,
    "--color-secondary-hover": normalized.secondaryHover,
    "--color-secondary-active": normalized.secondaryActive,
    "--color-secondary-foreground": normalized.secondaryForeground,

    "--color-cta": normalized.cta,
    "--color-cta-hover": normalized.ctaHover,
    "--color-cta-active": normalized.ctaActive,
    "--color-cta-foreground": normalized.ctaForeground,

    "--color-accent": normalized.accent,
    "--color-accent-hover": normalized.accentHover,
    "--color-accent-foreground": normalized.accentForeground,

    "--color-price": normalized.price,
    "--color-price-discount": normalized.priceDiscount,
    "--color-price-original": normalized.priceOriginal,
    "--color-add-to-cart": normalized.addToCart,
    "--color-add-to-cart-hover": normalized.addToCartHover,
    "--color-add-to-cart-foreground": normalized.addToCartForeground,
    "--color-buy-now": normalized.buyNow,
    "--color-buy-now-foreground": normalized.buyNowForeground,

    "--color-border": normalized.border,
    "--color-border-strong": normalized.borderStrong,
    "--color-divider": normalized.divider,

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

    // Backward-compatibility Bloom aliases
    "--bloom-background": normalized.background,
    "--bloom-card": normalized.surface,
    "--bloom-foreground": normalized.textPrimary,
    "--bloom-muted": normalized.textSecondary,
    "--bloom-primary": normalized.addToCart,
    "--bloom-primary-foreground": normalized.addToCartForeground,
    "--bloom-secondary": normalized.secondary,
    "--bloom-border": normalized.border,
    "--bloom-accent": `${normalized.accent}18`,
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
