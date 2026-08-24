import { Theme } from "@/types/theme";

export interface IThemeRepository {
  getAll(): Promise<Theme[]>;
  getById(id: string): Promise<Theme | null>;
  getCurrentTheme(): Promise<Theme>;
  applyTheme(id: string): Promise<Theme | null>;
}

export * from "./theme-constants";

export { supabaseThemeRepository as themeRepository } from "./supabase/supabase-theme-repository";
