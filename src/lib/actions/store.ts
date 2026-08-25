"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { errorResponse, successResponse, getErrorMessage } from "@/lib/api-response";
import { ActionResponse, TenantStore } from "@/types";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import { PLANS } from "@/lib/feature-gating";
import { normalizeSlug } from "@/lib/urls";
import { supabaseAppearanceRepository } from "@/lib/repositories/supabase/supabase-appearance-repository";
import { supabaseCategoryRepository } from "@/lib/repositories/supabase/supabase-category-repository";
import { supabaseCollectionRepository } from "@/lib/repositories/supabase/supabase-collection-repository";
import { supabaseProductRepository } from "@/lib/repositories/supabase/supabase-product-repository";

export type CreateStorePayload = {
  name: string;
  slug?: string;
  category: string;
  themeSlug?: string;
  logoUrl?: string;
  description?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  headingFont?: string;
  bodyFont?: string;
  tagline?: string;
  phone?: string;
  whatsapp?: string;
  instagram?: string;
  facebook?: string;
  email?: string;
  businessAddress?: string;
  planName?: string;
  paymentStatus?: string;
  razorpaySubscriptionId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
};

const mockTakenSlugs = new Set<string>();

function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return !!(url && url !== "https://placeholder-url.supabase.co" && key && key !== "placeholder-anon-key");
}

/**
 * Checks if a store slug is available or suggests alternatives
 */
export async function checkSlugAvailabilityAction(
  slug: string,
  excludeStoreId?: string
): Promise<ActionResponse<{ available: boolean; suggestions?: string[] }>> {
  const cleanSlug = normalizeSlug(slug);
  if (!cleanSlug || cleanSlug.length < 3) {
    return errorResponse("Slug must be at least 3 characters.");
  }

  if (!isSupabaseConfigured()) {
    return successResponse({ available: true });
  }

  try {
    const supabase = await createServerSupabaseClient();
    let query = (supabase.from("stores") as any)
      .select("id")
      .eq("slug", cleanSlug);

    if (excludeStoreId) {
      query = query.neq("id", excludeStoreId);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      return errorResponse(error.message);
    }

    return successResponse({ available: !data });
  } catch (err) {
    return errorResponse(getErrorMessage(err));
  }
}

/**
 * Category-specific default category presets
 */
const defaultCategoriesMap: Record<string, string[]> = {
  Perfumes: ["Eau de Parfum", "Attar Oils", "Best Sellers", "New Arrivals", "Gift Sets"],
  Clothing: ["New Arrivals", "Men's Wear", "Women's Wear", "Accessories", "Sale"],
  Jewelry: ["Rings", "Necklaces", "Earrings", "Bracelets", "Custom Pieces"],
  Restaurant: ["Starters", "Main Course", "Beverages", "Desserts", "Chef's Special"],
  Electronics: ["Smartphones", "Audio & Headphones", "Laptops", "Smart Watches", "Accessories"],
  Furniture: ["Living Room", "Bedroom", "Office Desks", "Dining Tables", "Lighting"],
  Beauty: ["Skincare", "Haircare", "Makeup", "Fragrance", "Wellness"],
  Organic: ["Fresh Produce", "Cold Pressed Oils", "Grains & Seeds", "Superfoods"],
  Books: ["Fiction", "Non-Fiction", "Self Development", "Tech & Science", "Children"],
  Other: ["Featured Collection", "New Arrivals", "Best Sellers", "Special Offers"],
};

/**
 * Complete multi-step Store Onboarding Creation Action
 */
export async function createCompleteStoreAction(
  payload: CreateStorePayload
): Promise<ActionResponse<TenantStore>> {
  const {
    name,
    slug: rawSlug,
    category,
    themeSlug = "dark",
    logoUrl,
    description,
    primaryColor = "#800020",
    secondaryColor = "#111111",
    whatsapp,
    instagram,
    facebook,
    email,
    businessAddress,
  } = payload;

  if (!name || !category) {
    return errorResponse("Business name and category are required.");
  }

  const baseSlug = normalizeSlug(name);
  if (!baseSlug || baseSlug.length < 3) {
    return errorResponse("Please enter a valid store name.");
  }

  const RESERVED_SLUGS = [
    "admin", "dashboard", "login", "signup", "api", "store", "auth", 
    "choose-template", "create-store", "billing", "settings", "callback", 
    "demo", "choose-plan", "forgot-password", "reset-password", "verify-email"
  ];

  let slug = baseSlug;
  let suffix = 1;
  let isUnique = false;



  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return errorResponse("Unauthorized. Please log in first.");
    }

    // Resolve collision and reserved routes in database
    while (!isUnique) {
      if (RESERVED_SLUGS.includes(slug)) {
        suffix++;
        slug = `${baseSlug}-${suffix}`;
        continue;
      }

      const { data: existingStore } = await (supabase.from("stores") as any)
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

      if (!existingStore) {
        isUnique = true;
      } else {
        suffix++;
        slug = `${baseSlug}-${suffix}`;
      }
    }

    // Retrieve theme UUID by slug
    let themeId: string | null = null;
    const { data: themeRow } = await (supabase.from("themes") as any)
      .select("id")
      .eq("slug", themeSlug)
      .maybeSingle();
    if (themeRow) {
      themeId = themeRow.id;
    }

    // Create the Store record
    const { data: store, error: storeError } = await (supabase.from("stores") as any)
      .insert({
        user_id: user.id,
        name,
        slug,
        logo_url: logoUrl || null,
        theme_id: themeId,
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        description: description || null,
        whatsapp: whatsapp || null,
        instagram: instagram || null,
        facebook: facebook || null,
        email: email || user.email || null,
        business_address: businessAddress || null,
        currency: "INR",
        timezone: "Asia/Kolkata",
        language: "en",
        is_published: true,
      })
      .select()
      .single();

    if (storeError || !store) {
      if (storeError && (storeError.code === "23505" || storeError.message?.includes("unique constraint") || storeError.message?.includes("already exists"))) {
        return errorResponse("That store URL was just taken. Please choose another.");
      }
      return errorResponse(storeError?.message || "Failed to create store.");
    }

    const initialAppearance = {
      themeId: "bloom",
      branding: {
        name: store.name,
        logoUrl: logoUrl || undefined,
        heroBannerUrl: undefined,
        tagline: payload.tagline || undefined,
        description: description || undefined,
        whatsapp: whatsapp || undefined,
        phone: payload.phone || undefined,
        email: email || user.email || undefined,
        instagram: instagram || undefined,
        facebook: facebook || undefined,
        address: businessAddress || undefined,
      },
      colors: {
        primary: primaryColor || "#18181B",
        secondary: secondaryColor || "#F4F4F5",
        accent: payload.accentColor || "#F97316",
        background: "#FFFFFF",
      },
      typography: {
        headingFont: payload.headingFont || "Plus Jakarta Sans",
        bodyFont: payload.bodyFont || "Inter",
        animationStyle: "smooth",
      },
      homepageSections: ["hero", "categories", "featured", "collections", "banner"],
      seo: {
        seoTitle: store.name,
        seoDescription: description || "",
      }
    };

    // Create settings record with onboarding customized design
    await (supabase.from("store_settings") as any).insert({
      store_id: store.id,
      shipping_enabled: true,
      tax_rate: 0.00,
      metadata: {
        appearance: initialAppearance
      }
    });

    // Create subscription record
    const subscriptionPlan = payload.planName || "startup";
    const subscriptionStatus = payload.paymentStatus || "active";

    // Verify Razorpay signature if plan is paid and status is active
    if (subscriptionStatus === "active") {
      const keySecret = process.env.RAZORPAY_KEY_SECRET || "";
      if (keySecret && payload.razorpaySignature && payload.razorpayPaymentId && payload.razorpaySubscriptionId) {
        const expected = crypto
          .createHmac("sha256", keySecret)
          .update(payload.razorpayPaymentId + "|" + payload.razorpaySubscriptionId)
          .digest("hex");
        if (expected !== payload.razorpaySignature) {
          throw new Error("Cryptographic verification failed for store onboarding subscription.");
        }
      }
    }

    let start = new Date();
    let end = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Fetch actual Razorpay subscription period end dates if credentials are configured
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (keyId && keySecret && payload.razorpaySubscriptionId && !payload.razorpaySubscriptionId.startsWith("sub_mock_")) {
      try {
        const Razorpay = require("razorpay");
        const rzp = new Razorpay({ key_id: keyId, key_secret: keySecret });
        const subDetails = await rzp.subscriptions.fetch(payload.razorpaySubscriptionId);
        start = new Date(subDetails.current_start * 1000);
        end = new Date(subDetails.current_end * 1000);
      } catch (e) {
        console.error("Error fetching live subscription period:", e);
      }
    }

    await (supabase.from("subscriptions") as any).insert({
      store_id: store.id,
      plan: subscriptionPlan,
      status: subscriptionStatus,
      razorpay_subscription_id: payload.razorpaySubscriptionId || null,
      razorpay_signature: payload.razorpaySignature || null,
      current_period_start: subscriptionStatus === "active" ? start.toISOString() : null,
      current_period_end: subscriptionStatus === "active" ? end.toISOString() : null,
    });

    // Create successful payment log record if paid
    if (subscriptionStatus === "active") {
      const planConfig = PLANS[subscriptionPlan as "startup" | "growth" | "pro"];
      await (supabase.from("payments") as any).insert({
        store_id: store.id,
        plan: subscriptionPlan,
        razorpay_payment_id: payload.razorpayPaymentId || `pay_mock_${Date.now()}`,
        razorpay_subscription_id: payload.razorpaySubscriptionId || "mock_sub_id",
        amount: planConfig?.priceMonthly || 0,
        currency: "INR",
        status: "successful",
      });
    }

    revalidatePath("/dashboard");

    return successResponse<TenantStore>({
      id: store.id,
      name: store.name,
      slug: store.slug,
      plan: (subscriptionStatus === "active" ? subscriptionPlan : "startup") as any,
      isPublished: true,
      currency: "INR",
      createdAt: store.created_at,
    }, "Store created successfully.");
  } catch (err) {
    return errorResponse(getErrorMessage(err));
  }
}

/**
 * Fetch all stores owned by current authenticated user
 */
export async function getUserStoresAction(): Promise<ActionResponse<TenantStore[]>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return errorResponse("Unauthorized.");
    }

    const { data: stores, error } = await (supabase.from("stores") as any)
      .select(`
        *,
        subscriptions (plan)
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return errorResponse(error.message);
    }

    const mappedStores: TenantStore[] = (stores || []).map((s: any) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      logoUrl: s.logo_url || undefined,
      bannerUrl: s.banner_url || undefined,
      plan: (s.subscriptions?.[0]?.plan) || "startup",
      isPublished: s.is_published,
      currency: s.currency,
      createdAt: s.created_at,
    }));

    return successResponse(mappedStores);
  } catch (err) {
    return errorResponse(getErrorMessage(err));
  }
}

/**
 * Publish all store draft changes to the live store by compiling a snapshot
 */
export async function publishStoreChangesAction(storeId: string): Promise<ActionResponse<void>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return errorResponse("Unauthorized.");
    }

    // Verify ownership of the store
    const { data: storeRow, error: storeErr } = await (supabase.from("stores") as any)
      .select("id, name, slug")
      .eq("id", storeId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (storeErr || !storeRow) {
      return errorResponse("Store not found or access denied.");
    }

    // Fetch all current draft data
    const appearance = await supabaseAppearanceRepository.getSettings(storeId, supabase);
    const categories = await supabaseCategoryRepository.getAll(storeId, supabase);
    const collections = await supabaseCollectionRepository.getAll(storeId, supabase);
    const { products } = await supabaseProductRepository.getAll(storeId, undefined, 1, 1000, supabase);

    // Fetch existing settings metadata
    const { data: settingsRow } = await (supabase.from("store_settings") as any)
      .select("id, metadata")
      .eq("store_id", storeId)
      .maybeSingle();

    const existingMetadata = (settingsRow as any)?.metadata || {};
    const shipping = existingMetadata.shipping || { freeShippingEnabled: true, freeShippingThreshold: 999 };

    const updatedMetadata = {
      ...existingMetadata,
      published_snapshot: {
        id: storeId,
        name: (storeRow as any).name,
        slug: (storeRow as any).slug,
        appearance,
        categories,
        collections,
        products,
        shipping,
      }
    };

    if (settingsRow) {
      const { error: updateErr } = await (supabase.from("store_settings") as any)
        .update({ metadata: updatedMetadata })
        .eq("id", (settingsRow as any).id);
      if (updateErr) throw updateErr;
    } else {
      const { error: insertErr } = await (supabase.from("store_settings") as any)
        .insert({
          store_id: storeId,
          metadata: updatedMetadata
        });
      if (insertErr) throw insertErr;
    }

    // Also make sure is_published is true on the store itself
    await (supabase.from("stores") as any)
      .update({ is_published: true })
      .eq("id", storeId);

    revalidatePath(`/store/${(storeRow as any).slug}`);
    
    return successResponse(undefined, "Changes published successfully to live store.");
  } catch (err) {
    return errorResponse(getErrorMessage(err));
  }
}

/**
 * Fetch free shipping settings for a store
 */
export async function getStoreShippingSettingsAction(
  storeId: string
): Promise<ActionResponse<{ freeShippingEnabled: boolean; freeShippingThreshold: number }>> {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Tenant check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return errorResponse("Unauthorized");

    const { data: storeRow } = await supabase.from("stores")
      .select("id")
      .eq("id", storeId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!storeRow) {
      return errorResponse("Store not found or access denied.");
    }

    const { data: settingsRow, error } = await (supabase.from("store_settings") as any)
      .select("metadata")
      .eq("store_id", storeId)
      .maybeSingle();

    if (error) {
      return errorResponse(error.message);
    }

    const metadata = settingsRow?.metadata || {};
    const shipping = metadata.shipping || { freeShippingEnabled: true, freeShippingThreshold: 999 };

    return successResponse(shipping);
  } catch (err) {
    return errorResponse(getErrorMessage(err));
  }
}

/**
 * Update free shipping settings for a store
 */
export async function updateStoreShippingSettingsAction(
  storeId: string,
  freeShippingEnabled: boolean,
  freeShippingThreshold: number
): Promise<ActionResponse<void>> {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Tenant check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return errorResponse("Unauthorized");

    const { data: storeRow } = await supabase.from("stores")
      .select("id")
      .eq("id", storeId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!storeRow) {
      return errorResponse("Store not found or access denied.");
    }

    const { data: settingsRow, error } = await (supabase.from("store_settings") as any)
      .select("id, metadata")
      .eq("store_id", storeId)
      .maybeSingle();

    if (error) {
      return errorResponse(error.message);
    }

    const existingMetadata = settingsRow?.metadata || {};
    const updatedMetadata = {
      ...existingMetadata,
      shipping: {
        freeShippingEnabled,
        freeShippingThreshold,
      },
    };

    if (settingsRow) {
      const { error: updateErr } = await (supabase.from("store_settings") as any)
        .update({ metadata: updatedMetadata })
        .eq("id", settingsRow.id);
      if (updateErr) throw updateErr;
    } else {
      const { error: insertErr } = await (supabase.from("store_settings") as any)
        .insert({
          store_id: storeId,
          metadata: updatedMetadata
        });
      if (insertErr) throw insertErr;
    }

    return successResponse(undefined, "Shipping settings updated successfully.");
  } catch (err) {
    return errorResponse(getErrorMessage(err));
  }
}

/**
 * Attempt to resolve OG image from a webpage URL server-side
 */
export async function resolveOgImageAction(url: string): Promise<ActionResponse<{ imageUrl: string | null }>> {
  if (!url || typeof url !== "string") {
    return errorResponse("Invalid URL");
  }

  const trimmed = url.trim();
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return errorResponse("URL must use HTTP or HTTPS protocol");
  }

  // Sanitization check
  if (trimmed.toLowerCase().includes("javascript:") || trimmed.toLowerCase().includes("data:") || trimmed.toLowerCase().includes("file:")) {
    return errorResponse("Unsafe URL protocol detected.");
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const res = await fetch(trimmed, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      }
    });
    
    clearTimeout(timeoutId);

    if (!res.ok) {
      return successResponse({ imageUrl: null }, "Webpage returned non-200 status.");
    }

    const html = await res.text();
    
    // Extract og:image using regex
    const ogImageRegex = /<meta\s+[^>]*property=["']og:image["']\s+[^>]*content=["']([^"']+)["']/i;
    const twitterImageRegex = /<meta\s+[^>]*name=["']twitter:image["']\s+[^>]*content=["']([^"']+)["']/i;
    
    let ogImageUrl = html.match(ogImageRegex)?.[1] || html.match(twitterImageRegex)?.[1];
    
    // Resolve relative URL if needed
    if (ogImageUrl && !ogImageUrl.startsWith("http://") && !ogImageUrl.startsWith("https://")) {
      try {
        const base = new URL(trimmed);
        ogImageUrl = new URL(ogImageUrl, base.origin).toString();
      } catch {
        // Ignore parsing errors
      }
    }

    return successResponse({ imageUrl: ogImageUrl || null });
  } catch (err) {
    console.error("Failed to resolve OG image:", err);
    return successResponse({ imageUrl: null }, "Failed to fetch webpage or parse metadata.");
  }
}

