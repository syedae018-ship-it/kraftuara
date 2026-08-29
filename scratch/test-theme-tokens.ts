/**
 * Kraftaura Theme Tokens & Color Palette Verification Suite
 */

import {
  CURATED_PALETTES,
  CURATED_PALETTES_LIST,
  DEFAULT_PALETTE_ID,
  MIDNIGHT_LUXURY_PALETTE,
  WARM_MAROON_PALETTE,
  OLIVE_NATURAL_PALETTE,
  CHARCOAL_ORANGE_PALETTE,
} from "../src/lib/theme-palettes";
import {
  calculateContrast,
  getOptimalForeground,
  getRelativeLuminance,
  isDarkColor,
  normalizeHex,
  validateTokenContrast,
} from "../src/lib/color-utils";
import { resolveThemeTokens, identifyPaletteId } from "../src/lib/theme-token-resolver";
import { CuratedPaletteId, ThemeTokens } from "../src/types/theme";

const REQUIRED_TOKEN_KEYS: (keyof ThemeTokens)[] = [
  // Background
  "background",
  "backgroundSecondary",
  "surface",
  "surfaceElevated",
  // Text
  "textPrimary",
  "textSecondary",
  "textMuted",
  "textOnPrimary",
  "textOnAccent",
  // Brand
  "primary",
  "primaryHover",
  "primaryActive",
  "primaryForeground",
  // Secondary
  "secondary",
  "secondaryHover",
  "secondaryActive",
  "secondaryForeground",
  // CTA
  "cta",
  "ctaHover",
  "ctaActive",
  "ctaForeground",
  // Accent
  "accent",
  "accentHover",
  "accentForeground",
  // Commerce
  "price",
  "priceDiscount",
  "priceOriginal",
  "addToCart",
  "addToCartHover",
  "addToCartForeground",
  "buyNow",
  "buyNowForeground",
  // Borders
  "border",
  "borderStrong",
  "divider",
  // Status
  "success",
  "successForeground",
  "warning",
  "warningForeground",
  "error",
  "errorForeground",
  "info",
  "infoForeground",
];

function runTests() {
  console.log("==================================================");
  console.log("KRAFTAURA THEME TOKEN SYSTEM — VERIFICATION SUITE");
  console.log("==================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // 1. Curated Palettes completeness
  console.log("--- 1. Curated Palettes Completeness ---");
  assert(CURATED_PALETTES_LIST.length === 4, "Exactly 4 curated palettes defined");
  
  const paletteIds: CuratedPaletteId[] = [
    "midnight-luxury",
    "warm-maroon",
    "olive-natural",
    "charcoal-orange",
  ];

  for (const id of paletteIds) {
    const palette = CURATED_PALETTES[id];
    assert(!!palette, `Palette ${id} exists in dictionary`);
    assert(palette.name.length > 0, `Palette ${id} has a name`);
    assert(palette.previewSwatches.background.startsWith("#"), `Palette ${id} has valid swatch BG`);

    let missingTokens = 0;
    for (const key of REQUIRED_TOKEN_KEYS) {
      if (!palette.tokens[key] || typeof palette.tokens[key] !== "string") {
        console.error(`Missing token: ${key} in ${id}`);
        missingTokens++;
      }
    }
    assert(missingTokens === 0, `Palette ${id} contains all 36 required semantic tokens`);
  }

  // 2. WCAG Contrast Calculation & Relative Luminance
  console.log("\n--- 2. WCAG 2.1 Luminance & Contrast Math ---");
  assert(getRelativeLuminance("#000000") === 0, "Black relative luminance is 0.0");
  assert(Math.abs(getRelativeLuminance("#FFFFFF") - 1.0) < 0.001, "White relative luminance is 1.0");
  
  const maxContrast = calculateContrast("#FFFFFF", "#000000");
  assert(Math.abs(maxContrast - 21.0) < 0.1, "White on Black has maximum 21:1 contrast ratio");

  const minContrast = calculateContrast("#FFFFFF", "#FFFFFF");
  assert(Math.abs(minContrast - 1.0) < 0.01, "White on White has 1:1 contrast ratio");

  // 3. Guaranteed High-Contrast Optimal Foregrounds
  console.log("\n--- 3. Guaranteed Readable Foregrounds ---");
  // White background -> Optimal text must be dark
  assert(getOptimalForeground("#FFFFFF") === "#0B0B0C", "Optimal text on white (#FFFFFF) is dark (#0B0B0C)");
  // Black background -> Optimal text must be light
  assert(getOptimalForeground("#000000") === "#FFFFFF", "Optimal text on black (#000000) is light (#FFFFFF)");
  // Gold button (#C9A96E) -> Optimal text must be dark
  assert(getOptimalForeground("#C9A96E") === "#0B0B0C", "Optimal text on gold (#C9A96E) is dark (#0B0B0C)");
  // Dark Maroon button (#7A1028) -> Optimal text must be white
  assert(getOptimalForeground("#7A1028") === "#FFFFFF", "Optimal text on deep maroon (#7A1028) is white (#FFFFFF)");
  // Vibrant Orange button (#F97316) -> Optimal text calculation
  const orangeOptimal = getOptimalForeground("#F97316");
  assert(calculateContrast(orangeOptimal, "#F97316") >= 2.8, "Optimal text on orange (#F97316) has high contrast (>= 2.8:1)");


  // 4. Curated Palettes Contrast Verification
  console.log("\n--- 4. Curated Palettes Contrast Auditing ---");
  for (const id of paletteIds) {
    const palette = CURATED_PALETTES[id];
    const issues = validateTokenContrast(palette.tokens);
    const criticalFailures = issues.filter((i) => !i.isSufficient);
    assert(
      criticalFailures.length === 0,
      `Curated Palette "${palette.name}" passes all WCAG contrast checks (0 critical failures)`
    );
  }

  // 5. Theme Resolver with Custom Overrides & Legacy Normalization
  console.log("\n--- 5. Theme Resolver & Safe Custom Overrides ---");
  // Test A: Clean default resolution
  const resolvedDefault = resolveThemeTokens({ paletteId: "midnight-luxury" });
  assert(resolvedDefault.tokens.background === "#0B0B0C", "Midnight Luxury resolves black background");
  assert(resolvedDefault.tokens.primary === "#C9A96E", "Midnight Luxury resolves gold primary");
  assert(resolvedDefault.cssVariables["--color-background"] === "#0B0B0C", "CSS variable --color-background is set");
  assert(resolvedDefault.cssVariables["--color-add-to-cart"] === "#C9A96E", "CSS variable --color-add-to-cart is set");
  assert(resolvedDefault.cssVariables["--color-price"] === "#D8B878", "CSS variable --color-price is set");

  // Test B: Custom override on CTA button
  const resolvedWithOverride = resolveThemeTokens({
    paletteId: "midnight-luxury",
    customOverrides: {
      cta: "#FFFFFF",
    },
  });
  assert(resolvedWithOverride.tokens.cta === "#FFFFFF", "Custom CTA override applied");
  assert(resolvedWithOverride.tokens.ctaForeground === "#0B0B0C", "Auto-computed CTA foreground is dark on white CTA button");

  // Test C: Legacy 4-color mapping
  const legacyAppearance = {
    colors: {
      primary: "#7A1028",
      secondary: "#F2E6DF",
      accent: "#B88A3B",
      background: "#FFF9F5",
    },
  };
  const resolvedLegacy = resolveThemeTokens(legacyAppearance);
  assert(resolvedLegacy.paletteId === "warm-maroon", "Legacy maroon colors auto-identify Warm Maroon palette");
  assert(resolvedLegacy.tokens.price === "#7A1028", "Legacy config normalizes with complete price token");
  assert(resolvedLegacy.tokens.addToCart === "#8E1730", "Legacy config normalizes with complete addToCart token");

  // Test D: Invalid hex handling
  assert(normalizeHex("invalid", "#000000") === "#000000", "Invalid hex returns safe fallback");
  assert(normalizeHex("#fff") === "#FFFFFF", "Short 3-char hex expands to 6-char hex");

  console.log("\n==================================================");
  console.log(`TOTAL: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
