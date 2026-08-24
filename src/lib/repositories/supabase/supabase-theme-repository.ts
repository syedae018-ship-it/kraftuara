import { Theme } from "@/types/theme";
import type { IThemeRepository } from "@/lib/repositories/theme-repository";
import { initialThemes } from "@/lib/repositories/theme-constants";
import { createClient } from "@/lib/supabase/client";

export class SupabaseThemeRepository implements IThemeRepository {
  private getSupabase() {
    return createClient();
  }

  async getAll(): Promise<Theme[]> {
    const supabase = this.getSupabase();
    const { data, error } = await supabase.from("themes").select("*");

    if (error || !data || data.length === 0) {
      return [...initialThemes];
    }

    return data.map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description || "",
      thumbnail: row.thumbnail_url || "",
      previewImages: [row.thumbnail_url || ""],
      version: row.version,
      author: "Platform",
      supportsDarkMode: true,
      supportsHero: true,
      supportsCollections: true,
      supportsTestimonials: true,
      supportsVideo: false,
      status: row.status as any,
    }));
  }

  async getById(id: string): Promise<Theme | null> {
    const all = await this.getAll();
    return all.find((t) => t.id === id) || null;
  }

  async getActiveTheme(): Promise<Theme> {
    const all = await this.getAll();
    return all.find((t) => t.status === "active") || all[0];
  }

  async getCurrentTheme(): Promise<Theme> {
    return this.getActiveTheme();
  }

  async setActiveTheme(id: string): Promise<Theme> {
    const theme = await this.getById(id);
    if (!theme) throw new Error("Theme not found");
    return { ...theme, status: "active" };
  }

  async applyTheme(id: string): Promise<Theme | null> {
    try {
      const theme = await this.setActiveTheme(id);
      return theme;
    } catch (e) {
      return null;
    }
  }
}

export const supabaseThemeRepository = new SupabaseThemeRepository();
