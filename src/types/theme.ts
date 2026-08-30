export type ThemeStatus = "active" | "installed" | "available";

export type SectionId =
  | "hero"
  | "featured_products"
  | "categories"
  | "collections"
  | "testimonials"
  | "instagram_feed"
  | "about"
  | "faq"
  | "contact"
  | "newsletter"
  | "footer";

export type HomepageSectionConfig = {
  id: SectionId;
  title: string;
  enabled: boolean;
  order: number;
};

export type CuratedPaletteId =
  | "midnight-luxury"
  | "warm-maroon"
  | "olive-natural"
  | "charcoal-orange";

/**
 * Complete set of semantic design tokens required for any storefront theme.
 */
export interface ThemeTokens {
  // Background
  background: string;
  backgroundSecondary: string;
  surface: string;
  surfaceElevated: string;

  // Text
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textOnPrimary: string;
  textOnAccent: string;

  // Brand / Primary
  primary: string;
  primaryHover: string;
  primaryActive: string;
  primaryForeground: string;

  // Secondary
  secondary: string;
  secondaryHover: string;
  secondaryActive: string;
  secondaryForeground: string;

  // CTA
  cta: string;
  ctaHover: string;
  ctaActive: string;
  ctaForeground: string;

  // Accent
  accent: string;
  accentHover: string;
  accentForeground: string;

  // Commerce / Product
  price: string;
  priceDiscount: string;
  priceOriginal: string;
  addToCart: string;
  addToCartHover: string;
  addToCartForeground: string;
  buyNow: string;
  buyNowForeground: string;

  // Borders & Dividers
  border: string;
  borderStrong: string;
  divider: string;

  // Status
  success: string;
  successForeground: string;
  warning: string;
  warningForeground: string;
  error: string;
  errorForeground: string;
  info: string;
  infoForeground: string;
}

/**
 * Backward compatibility 4-color tuple
 */
export type ThemeColors = {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
};

export type StoreBranding = {
  name: string;
  tagline: string;
  description?: string;
  logoUrl?: string;
  faviconUrl?: string;
  heroBannerUrl?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  instagram?: string;
  facebook?: string;
  address?: string;
};

export type TypographyConfig = {
  headingFont?: string;
  bodyFont?: string;
  animationStyle: "subtle" | "smooth" | "bounce" | "none" | "luxurious" | "crisp" | "vibrant";
};

export type HomepageSEOConfig = {
  seoTitle: string;
  seoDescription: string;
  socialImageUrl?: string;
};

export type AppearanceSettings = {
  themeId: string;
  paletteId?: CuratedPaletteId | string;
  customOverrides?: Partial<ThemeTokens>;
  branding: StoreBranding;
  colors: ThemeColors;
  tokens?: Partial<ThemeTokens> | ThemeTokens;
  typography: TypographyConfig;
  homepageSections: HomepageSectionConfig[];
  seo: HomepageSEOConfig;
  updatedAt: string;
};

export type AppearanceSettingsUpdate = {
  themeId?: string;
  paletteId?: CuratedPaletteId | string;
  customOverrides?: Partial<ThemeTokens>;
  branding?: Partial<StoreBranding>;
  colors?: Partial<ThemeColors>;
  tokens?: Partial<ThemeTokens>;
  typography?: Partial<TypographyConfig>;
  homepageSections?: HomepageSectionConfig[];
  seo?: Partial<HomepageSEOConfig>;
  updatedAt?: string;
};

export type Theme = {
  id: string;
  name: string;
  tag?: string;
  description: string;
  thumbnail: string;
  previewImages: string[];
  version: string;
  author: string;
  supportsDarkMode: boolean;
  supportsHero: boolean;
  supportsCollections: boolean;
  supportsTestimonials: boolean;
  supportsVideo: boolean;
  status: ThemeStatus;
};
