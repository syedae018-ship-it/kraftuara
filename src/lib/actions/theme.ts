"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

interface ActionResponse<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

const THEME_PRESETS: Record<string, {
  name: string;
  paletteId: string;
  colors: { primary: string; secondary: string; accent: string; background: string };
  typography: { headingFont: string; bodyFont: string; animationStyle: string };
}> = {
  bloom: {
    name: "Charcoal / Orange",
    paletteId: "charcoal-orange",
    colors: { primary: "#202124", secondary: "#EEEEEE", accent: "#F97316", background: "#F7F7F7" },
    typography: { headingFont: "Plus Jakarta Sans", bodyFont: "Inter", animationStyle: "smooth" },
  },
  luxury: {
    name: "Midnight Luxury",
    paletteId: "midnight-luxury",
    colors: { primary: "#C9A96E", secondary: "#242220", accent: "#E4C98A", background: "#0B0B0C" },
    typography: { headingFont: "Playfair Display", bodyFont: "Plus Jakarta Sans", animationStyle: "luxurious" },
  },
  modern: {
    name: "Warm Maroon",
    paletteId: "warm-maroon",
    colors: { primary: "#7A1028", secondary: "#F2E6DF", accent: "#B88A3B", background: "#FFF9F5" },
    typography: { headingFont: "Plus Jakarta Sans", bodyFont: "Inter", animationStyle: "smooth" },
  },
  creative: {
    name: "Olive / Natural",
    paletteId: "olive-natural",
    colors: { primary: "#536B3E", secondary: "#E6ECE0", accent: "#A88A4A", background: "#F7F7F2" },
    typography: { headingFont: "Plus Jakarta Sans", bodyFont: "Inter", animationStyle: "smooth" },
  },
};


export async function applyThemeAction(
  storeId: string,
  themeId: string
): Promise<ActionResponse<{ themeId: string; name: string }>> {
  try {
    const supabase = await createServerSupabaseClient();

    // 1. Auth & Store ownership verification
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const { data: storeRow } = await supabase
      .from("stores")
      .select("id, slug")
      .eq("id", storeId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!storeRow) {
      return { success: false, error: "Store not found or access denied." };
    }

    // 2. Pro plan entitlement check for advanced themes
    const isProTheme = themeId !== "bloom";
    if (isProTheme) {
      const { data: subRow } = await (supabase.from("subscriptions") as any)
        .select("plan, status, current_period_end")
        .eq("store_id", storeId)
        .maybeSingle();

      const { normalizePlanTier, hasFeatureAccess } = await import("@/lib/feature-gating");
      let plan = "startup";
      let subStatus = subRow?.status || "active";
      if (subRow) {
        plan = normalizePlanTier(subRow.plan);
        if (subRow.current_period_end && new Date(subRow.current_period_end).getTime() < Date.now()) {
          subStatus = "expired";
        }
      }
      if (subStatus === "expired" || subStatus === "cancelled" || subStatus === "pending") {
        plan = "startup";
      }

      if (!hasFeatureAccess(plan, "advanced_themes") && !hasFeatureAccess(plan, "premium_themes")) {
        return {
          success: false,
          error: "Advanced theme gallery is exclusive to the Pro Plan (₹499/mo). Please upgrade to activate.",
        };
      }
    }

    // 3. Load existing store settings
    const { data: settingsRow } = await (supabase.from("store_settings") as any)
      .select("id, metadata")
      .eq("store_id", storeId)
      .maybeSingle();

    const existingMetadata = settingsRow?.metadata || {};
    const existingAppearance = existingMetadata.appearance || {};

    const preset = THEME_PRESETS[themeId] || THEME_PRESETS.bloom;

    const updatedAppearance = {
      ...existingAppearance,
      themeId,
      paletteId: preset.paletteId,
      customOverrides: {},
      colors: preset.colors,
      typography: preset.typography,
      updatedAt: new Date().toISOString(),
    };


    const updatedMetadata = {
      ...existingMetadata,
      appearance: updatedAppearance,
    };

    // Update published snapshot if it exists so storefront reflects it immediately
    if (updatedMetadata.published_snapshot) {
      updatedMetadata.published_snapshot = {
        ...updatedMetadata.published_snapshot,
        appearance: updatedAppearance,
      };
    }

    if (settingsRow) {
      const { error: updateErr } = await (supabase.from("store_settings") as any)
        .update({ metadata: updatedMetadata })
        .eq("id", settingsRow.id);
      if (updateErr) throw updateErr;
    } else {
      const { error: insertErr } = await (supabase.from("store_settings") as any)
        .insert({
          store_id: storeId,
          metadata: updatedMetadata,
        });
      if (insertErr) throw insertErr;
    }

    // Auto-publish theme changes immediately to live store
    const { publishingEngine } = await import("@/lib/services/publishing-engine");
    await publishingEngine.triggerAutoPublish(storeId, supabase);

    revalidatePath("/dashboard/appearance");
    revalidatePath("/dashboard/themes");


    return {
      success: true,
      data: { themeId, name: preset.name },
      message: `Switched active theme to ${preset.name}.`,
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to apply theme." };
  }
}
