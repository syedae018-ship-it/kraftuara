import { Collection, CreateCollectionInput } from "@/types/collection";

import { createClient } from "@/lib/supabase/client";

import { ICollectionRepository } from "../collection-repository";

export class SupabaseCollectionRepository implements ICollectionRepository {
  private getSupabase() {
    return createClient();
  }

  async getAll(storeId: string, client?: any): Promise<Collection[]> {
    const supabase = client || this.getSupabase();
    const { data, error } = await supabase.from("collections" as any).select("*").eq("store_id", storeId);

    if (error || !data || data.length === 0) {
      return [];
    }

    return data.map((row: any) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description || undefined,
      coverImage: row.cover_image_url || undefined,
      status: "published",
      displayOrder: 0,
      selectedProductIds: row.selected_product_ids || [],
      productCount: (row.selected_product_ids || []).length,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  async getById(id: string, client?: any): Promise<Collection | null> {
    const supabase = client || this.getSupabase();
    const { data, error } = await supabase.from("collections" as any).select("*").eq("id", id).maybeSingle();

    if (error || !data) return null;

    const row = data as any;
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description || undefined,
      coverImage: row.cover_image_url || undefined,
      status: "published",
      displayOrder: 0,
      selectedProductIds: row.selected_product_ids || [],
      productCount: (row.selected_product_ids || []).length,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async create(storeId: string, input: CreateCollectionInput, client?: any): Promise<Collection> {
    const slug = input.slug || input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const supabase = client || this.getSupabase();

    const { data, error } = await supabase
      .from("collections" as any)
      .insert({
        store_id: storeId,
        name: input.name,
        slug,
        description: input.description,
        cover_image_url: input.coverImage,
        selected_product_ids: input.selectedProductIds || [],
      } as any)
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || "Failed to create collection");
    }

    return {
      id: (data as any).id,
      name: (data as any).name,
      slug: (data as any).slug,
      description: (data as any).description || undefined,
      coverImage: (data as any).cover_image_url || undefined,
      status: "published",
      displayOrder: 0,
      selectedProductIds: (data as any).selected_product_ids || [],
      productCount: ((data as any).selected_product_ids || []).length,
      createdAt: (data as any).created_at,
      updatedAt: (data as any).updated_at,
    };
  }

  async update(id: string, input: Partial<Collection>, client?: any): Promise<Collection | null> {
    const supabase = client || this.getSupabase();
    const { data, error } = await (supabase.from("collections" as any) as any)
      .update({
        name: input.name,
        slug: input.slug,
        description: input.description,
        cover_image_url: input.coverImage,
        selected_product_ids: input.selectedProductIds,
      } as any)
      .eq("id", id)
      .select()
      .single();

    if (error || !data) return null;

    const row = data as any;
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description || undefined,
      coverImage: row.cover_image_url || undefined,
      status: "published",
      displayOrder: 0,
      selectedProductIds: row.selected_product_ids || [],
      productCount: (row.selected_product_ids || []).length,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async delete(id: string, client?: any): Promise<boolean> {
    const supabase = client || this.getSupabase();
    const { error } = await supabase.from("collections" as any).delete().eq("id", id);
    return !error;
  }

  async reorder(orderedIds: string[], client?: any): Promise<boolean> {
    const supabase = client || this.getSupabase();
    return true;
  }

  async duplicate(storeId: string, id: string, client?: any): Promise<Collection | null> {
    const target = await this.getById(id, client);
    if (!target) return null;

    return this.create(storeId, {
      name: `${target.name} (Copy)`,
      slug: `${target.slug}-copy`,
      description: target.description,
      coverImage: target.coverImage,
      status: "draft",
      selectedProductIds: target.selectedProductIds,
      displayOrder: target.displayOrder + 1,
    });
  }
}

export const supabaseCollectionRepository = new SupabaseCollectionRepository();
