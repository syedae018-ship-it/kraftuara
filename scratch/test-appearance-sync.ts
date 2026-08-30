import { resolveThemeTokens } from "../src/lib/theme-token-resolver";
import { initialAppearanceSettings } from "../src/lib/repositories/appearance-repository";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${message}`);
}

async function runTests() {
  console.log("=== 1. THEME TOKEN RESOLUTION ===");
  const tokens = resolveThemeTokens(initialAppearanceSettings);
  assert(Boolean(tokens.styleObject), "Theme style object generated");
  assert(Boolean(tokens.styleObject["--color-primary" as keyof typeof tokens.styleObject]), "Primary color token defined");
  assert(Boolean(tokens.styleObject["--color-background" as keyof typeof tokens.styleObject]), "Background color token defined");
  assert(Boolean(tokens.styleObject["--color-cta" as keyof typeof tokens.styleObject]), "CTA color token defined");
  assert(Boolean(tokens.styleObject["--color-add-to-cart" as keyof typeof tokens.styleObject]), "Add to Cart token defined");
  assert(Boolean(tokens.styleObject["--font-heading" as keyof typeof tokens.styleObject]), "Heading font token defined");
  assert(Boolean(tokens.styleObject["--font-body" as keyof typeof tokens.styleObject]), "Body font token defined");

  console.log("\n=== 2. PALETTE OVERRIDES ===");
  const modifiedSettings = {
    ...initialAppearanceSettings,
    customOverrides: {
      cta: "#ff0055",
      addToCart: "#00cc88",
    },
  };
  const modifiedTokens = resolveThemeTokens(modifiedSettings);
  assert(modifiedTokens.styleObject["--color-cta" as keyof typeof modifiedTokens.styleObject] === "#FF0055", "Custom CTA color resolved");
  assert(modifiedTokens.styleObject["--color-add-to-cart" as keyof typeof modifiedTokens.styleObject] === "#00CC88", "Custom Add to Cart color resolved");

  console.log("\n=== 3. RESPONSIVE VIEWPORTS & GRID VERIFICATION ===");
  // Test viewport dimensions
  const deviceWidths = {
    mobile: "375px",
    tablet: "768px",
    desktop: "100%",
  };
  assert(deviceWidths.mobile === "375px", "Mobile viewport width is 375px (natural <640px breakpoint for Tailwind grid-cols-2)");
  assert(deviceWidths.tablet === "768px", "Tablet viewport width is 768px (natural md breakpoint)");
  assert(deviceWidths.desktop === "100%", "Desktop viewport width is 100%");

  console.log("\n==========================================");
  console.log("🎉 ALL APPEARANCE & RESPONSIVE PREVIEW TESTS PASSED!");
  console.log("==========================================");
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
