import { AppearanceSettings, HomepageSectionConfig } from "@/types/theme";

export const defaultSections: HomepageSectionConfig[] = [
  { id: "hero", title: "Hero Banner & Tagline", enabled: true, order: 1 },
  { id: "featured_products", title: "Featured Products Grid", enabled: true, order: 2 },
  { id: "categories", title: "Product Categories", enabled: true, order: 3 },
  { id: "collections", title: "Curated Collections", enabled: true, order: 4 },
  { id: "testimonials", title: "Customer Reviews", enabled: true, order: 5 },
  { id: "about", title: "About Brand Story", enabled: true, order: 6 },
  { id: "instagram_feed", title: "Instagram Live Feed", enabled: true, order: 7 },
  { id: "faq", title: "Frequently Asked Questions", enabled: true, order: 8 },
  { id: "contact", title: "Store Location & Contact", enabled: true, order: 9 },
  { id: "newsletter", title: "Newsletter Signup", enabled: true, order: 10 },
  { id: "footer", title: "Footer Navigation & Links", enabled: true, order: 11 },
];

export const initialAppearanceSettings: AppearanceSettings = {
  themeId: "bloom",
  branding: {
    name: "My Store",
    tagline: "Premium Catalog Storefront",
    description: "Welcome to our store. Discover our latest collection of premium products.",
    logoUrl: "",
    faviconUrl: "",
    heroBannerUrl: "",
    email: "",
    phone: "",
    whatsapp: "",
    instagram: "",
    facebook: "",
    address: "",
  },
  colors: {
    primary: "#18181B",
    secondary: "#F4F4F5",
    accent: "#F97316",
    background: "#FFFFFF",
  },
  typography: {
    headingFont: "Helvetica Neue",
    bodyFont: "Inter",
    animationStyle: "smooth",
  },
  homepageSections: defaultSections,
  seo: {
    seoTitle: "My Store | Official Catalog",
    seoDescription: "Discover our exclusive products and catalog items.",
    socialImageUrl: "",
  },
  updatedAt: new Date().toISOString(),
};
