import { ReactNode } from "react";
import { Database } from "./database";
export * from "./order";

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type StoreRow = Database["public"]["Tables"]["stores"]["Row"];
export type StoreSettingsRow = Database["public"]["Tables"]["store_settings"]["Row"];
export type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];
export type ProductRow = Database["public"]["Tables"]["products"]["Row"];
export type ProductImageRow = Database["public"]["Tables"]["product_images"]["Row"];
export type SubscriptionRow = Database["public"]["Tables"]["subscriptions"]["Row"];
export type CreativeOrderRow = Database["public"]["Tables"]["creative_orders"]["Row"];
export type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];

export type TenantStore = {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  bannerUrl?: string;
  plan: "free" | "starter" | "pro" | "business";
  isPublished: boolean;
  currency: string;
  createdAt: string;
};

export type UserProfile = {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
};

export type ActionResponse<T = void> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string; fieldErrors?: Record<string, string> };

export type NavigationItem = {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  external?: boolean;
};

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export type ToastVariant = "default" | "success" | "error" | "warning" | "info";

export type ToastItem = {
  id: string;
  title: string;
  description?: ReactNode;
  variant?: ToastVariant;
  duration?: number;
};
