import { AppearanceSettings, AppearanceSettingsUpdate, HomepageSectionConfig } from "@/types/theme";

export interface IAppearanceRepository {
  getSettings(storeId: string, client?: any): Promise<AppearanceSettings>;
  updateSettings(storeId: string, partial: AppearanceSettingsUpdate, client?: any): Promise<AppearanceSettings>;
  undo(storeId: string, client?: any): Promise<AppearanceSettings | null>;
  redo(storeId: string, client?: any): Promise<AppearanceSettings | null>;
  resetDefaults(storeId: string, client?: any): Promise<AppearanceSettings>;
  canUndo(storeId: string): boolean;
  canRedo(storeId: string): boolean;
}

export * from "./appearance-constants";

export { supabaseAppearanceRepository as appearanceRepository } from "./supabase/supabase-appearance-repository";
