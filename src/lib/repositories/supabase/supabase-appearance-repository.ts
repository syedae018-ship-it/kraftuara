import { AppearanceSettings } from "@/types/theme";
import type { IAppearanceRepository } from "@/lib/repositories/appearance-repository";
import { initialAppearanceSettings } from "@/lib/repositories/appearance-constants";
import { createClient } from "@/lib/supabase/client";

export class SupabaseAppearanceRepository implements IAppearanceRepository {
  private getSupabase() {
    return createClient();
  }

  async getSettings(storeId: string, client?: any): Promise<AppearanceSettings> {
    const supabase = client || this.getSupabase();
    const { data: storeRow } = await (supabase.from("stores") as any)
      .select("name, logo_url, banner_url, description, whatsapp, instagram, facebook, email, business_address")
      .eq("id", storeId)
      .maybeSingle();
      
    const s = storeRow as any;
    const storeName = s?.name || "My Store";

    const { data, error } = await (supabase.from("store_settings") as any)
      .select("metadata")
      .eq("store_id", storeId)
      .maybeSingle();

    if (error || !data) {
      return {
        ...initialAppearanceSettings,
        branding: {
          ...initialAppearanceSettings.branding,
          name: storeName,
          logoUrl: s?.logo_url || undefined,
          heroBannerUrl: s?.banner_url || undefined,
          description: s?.description || undefined,
          whatsapp: s?.whatsapp || undefined,
          instagram: s?.instagram || undefined,
          facebook: s?.facebook || undefined,
          email: s?.email || undefined,
          address: s?.business_address || undefined,
        }
      };
    }

    const dbSettings = data?.metadata?.appearance || {};

    return {
      themeId: dbSettings.themeId || "bloom",
      branding: {
        name: dbSettings.branding?.name || storeName,
        logoUrl: dbSettings.branding?.logoUrl || s?.logo_url || undefined,
        faviconUrl: dbSettings.branding?.faviconUrl || undefined,
        heroBannerUrl: dbSettings.branding?.heroBannerUrl || s?.banner_url || undefined,
        tagline: dbSettings.branding?.tagline || undefined,
        description: dbSettings.branding?.description || s?.description || undefined,
        whatsapp: dbSettings.branding?.whatsapp || s?.whatsapp || undefined,
        phone: dbSettings.branding?.phone || undefined,
        email: dbSettings.branding?.email || s?.email || undefined,
        instagram: dbSettings.branding?.instagram || s?.instagram || undefined,
        facebook: dbSettings.branding?.facebook || s?.facebook || undefined,
        address: dbSettings.branding?.address || s?.business_address || undefined,
      },
      colors: {
        primary: dbSettings.colors?.primary || "#18181B",
        secondary: dbSettings.colors?.secondary || "#F4F4F5",
        accent: dbSettings.colors?.accent || "#F97316",
        background: dbSettings.colors?.background || "#FFFFFF",
      },
      typography: {
        headingFont: dbSettings.typography?.headingFont || "Plus Jakarta Sans",
        bodyFont: dbSettings.typography?.bodyFont || "Inter",
        animationStyle: dbSettings.typography?.animationStyle || "smooth",
      },
      homepageSections: dbSettings.homepageSections || initialAppearanceSettings.homepageSections,
      seo: {
        seoTitle: dbSettings.seo?.seoTitle || "",
        seoDescription: dbSettings.seo?.seoDescription || "",
        socialImageUrl: dbSettings.seo?.socialImageUrl || undefined,
      },
      updatedAt: dbSettings.updatedAt || new Date().toISOString(),
    };
  }

  async updateSettings(storeId: string, settings: Partial<AppearanceSettings>, client?: any): Promise<AppearanceSettings> {
    const supabase = client || this.getSupabase();
    const current = await this.getSettings(storeId, supabase);
    const merged: AppearanceSettings = {
      ...current,
      ...settings,
      branding: { ...current.branding, ...settings.branding },
      colors: { ...current.colors, ...settings.colors },
      typography: { ...current.typography, ...settings.typography },
      seo: { ...current.seo, ...settings.seo },
      updatedAt: new Date().toISOString(),
    };

    // Load existing settings
    const { data: settingsRow } = await (supabase.from("store_settings") as any)
      .select("id, metadata")
      .eq("store_id", storeId)
      .maybeSingle();

    const existingMetadata = settingsRow?.metadata || {};
    const updatedMetadata = {
      ...existingMetadata,
      appearance: merged
    };

    if (settingsRow) {
      const { error } = await (supabase.from("store_settings") as any)
        .update({ metadata: updatedMetadata })
        .eq("id", settingsRow.id);
      if (error) throw error;
    } else {
      const { error } = await (supabase.from("store_settings") as any)
        .insert({
          store_id: storeId,
          metadata: updatedMetadata
        });
      if (error) throw error;
    }

    return merged;
  }

  async resetToDefaults(storeId: string, client?: any): Promise<AppearanceSettings> {
    const supabase = client || this.getSupabase();
    return this.updateSettings(storeId, initialAppearanceSettings, supabase);
  }

  async resetDefaults(storeId: string, client?: any): Promise<AppearanceSettings> {
    const supabase = client || this.getSupabase();
    return this.resetToDefaults(storeId, supabase);
  }

  canUndo(storeId: string): boolean {
    return false;
  }

  canRedo(storeId: string): boolean {
    return false;
  }

  async undo(storeId: string, client?: any): Promise<AppearanceSettings> {
    const supabase = client || this.getSupabase();
    return this.getSettings(storeId, supabase);
  }

  async redo(storeId: string, client?: any): Promise<AppearanceSettings> {
    const supabase = client || this.getSupabase();
    return this.getSettings(storeId, supabase);
  }
}

export const supabaseAppearanceRepository = new SupabaseAppearanceRepository();
