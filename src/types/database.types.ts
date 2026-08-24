export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          role: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: string;
          updated_at?: string;
        };
      };
      stores: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          slug: string;
          category: string;
          custom_domain: string | null;
          status: "live" | "draft" | "suspended";
          plan: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          slug: string;
          category?: string;
          custom_domain?: string | null;
          status?: "live" | "draft" | "suspended";
          plan?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          slug?: string;
          category?: string;
          custom_domain?: string | null;
          status?: "live" | "draft" | "suspended";
          plan?: string;
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          store_id: string;
          category_id: string | null;
          name: string;
          slug: string;
          sku: string;
          price: number;
          compare_at_price: number | null;
          cost_per_item: number | null;
          stock: number;
          short_description: string | null;
          long_description: string | null;
          status: "published" | "draft" | "archived";
          featured: boolean;
          weight: number | null;
          tags: string[] | null;
          seo_title: string | null;
          seo_description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          category_id?: string | null;
          name: string;
          slug: string;
          sku: string;
          price: number;
          compare_at_price?: number | null;
          cost_per_item?: number | null;
          stock?: number;
          short_description?: string | null;
          long_description?: string | null;
          status?: "published" | "draft" | "archived";
          featured?: boolean;
          weight?: number | null;
          tags?: string[] | null;
          seo_title?: string | null;
          seo_description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          category_id?: string | null;
          name?: string;
          slug?: string;
          sku?: string;
          price?: number;
          compare_at_price?: number | null;
          stock?: number;
          short_description?: string | null;
          long_description?: string | null;
          status?: "published" | "draft" | "archived";
          featured?: boolean;
          tags?: string[] | null;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          store_id: string;
          name: string;
          slug: string;
          description: string | null;
          image_url: string | null;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          name: string;
          slug: string;
          description?: string | null;
          image_url?: string | null;
          display_order?: number;
        };
        Update: {
          name?: string;
          slug?: string;
          description?: string | null;
          image_url?: string | null;
          display_order?: number;
        };
      };
    };
  };
}
