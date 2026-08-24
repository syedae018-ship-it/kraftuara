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
  animationStyle: "subtle" | "smooth" | "bounce" | "none";
};

export type HomepageSEOConfig = {
  seoTitle: string;
  seoDescription: string;
  socialImageUrl?: string;
};

export type AppearanceSettings = {
  themeId: string;
  branding: StoreBranding;
  colors: ThemeColors;
  typography: TypographyConfig;
  homepageSections: HomepageSectionConfig[];
  seo: HomepageSEOConfig;
  updatedAt: string;
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
