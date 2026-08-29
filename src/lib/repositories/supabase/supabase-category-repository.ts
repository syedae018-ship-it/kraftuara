import { Category, CreateCategoryInput } from "@/types/category";
import { createClient } from "@/lib/supabase/client";
import { ICategoryRepository } from "../category-repository";
import { PLANS } from "@/lib/feature-gating";

export class SupabaseCategoryRepository implements ICategoryRepository {
  private getSupabase() {
    return createClient();
  }

  private async checkStoreOwner(storeId: string, client?: any) {
    const supabase = client || this.getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data: storeRow } = await supabase
      .from("stores")
      .select("id")
      .eq("id", storeId)
      .eq("user_id", user.id)
      .maybeSingle();
      
    if (!storeRow) throw new Error("Access Denied: You do not own this store.");
  }

  private async checkPlanLimit(storeId: string, client?: any) {
    const supabase = client || this.getSupabase();
    
    const { subscriptionEngine } = await import("@/lib/services/subscription-engine");
    const sub = await subscriptionEngine.getAuthoritativeSubscription(storeId, null, supabase);

    const { getCategoryLimit, isUnlimitedCategories } = await import("@/lib/feature-gating");
    if (isUnlimitedCategories(sub.plan)) {
      return; // Unlimited categories allowed for Growth & Pro
    }

    const limit = getCategoryLimit(sub.plan);


    const { count } = await supabase
      .from("categories")
      .select("id", { count: "exact", head: true })
      .eq("store_id", storeId);
    
    if ((count || 0) >= limit) {
      throw new Error(`Category limit reached. Startup Pack allows ${limit} category. Upgrade your plan to create more categories.`);
    }
  }

  async getAll(storeId: string, client?: any): Promise<Category[]> {
    const supabase = client || this.getSupabase();
    
    // Fetch products to count them in memory
    const { data: productRows } = await supabase
      .from("products")
      .select("category_id")
      .eq("store_id", storeId);

    const counts: Record<string, number> = {};
    if (productRows) {
      productRows.forEach((p: any) => {
        if (p.category_id) {
          counts[p.category_id] = (counts[p.category_id] || 0) + 1;
        }
      });
    }

    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("store_id", storeId)
      .order("position", { ascending: true });

    if (error || !data || data.length === 0) {
      return [];
    }

    return data.map((row: any) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description || undefined,
      coverImage: undefined,
      status: "published",
      displayOrder: row.position || 0,
      productCount: counts[row.id] || 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  async getById(id: string, client?: any): Promise<Category | null> {
    const supabase = client || this.getSupabase();
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) return null;

    const row = data as any;

    // Get count
    const { count } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("category_id", id);

    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description || undefined,
      coverImage: undefined,
      status: "published",
      displayOrder: row.position || 0,
      productCount: count || 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async create(storeId: string, input: CreateCategoryInput, client?: any): Promise<Category> {
    const supabase = client || this.getSupabase();
    await this.checkStoreOwner(storeId, supabase);
    await this.checkPlanLimit(storeId, supabase);
    let baseSlug = (input.slug || input.name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    
    let slug = baseSlug || "category";
    let counter = 1;
    while (true) {
      const { data } = await supabase
        .from("categories")
        .select("id")
        .eq("store_id", storeId)
        .eq("slug", slug)
        .maybeSingle();
      if (!data) break;
      slug = `${baseSlug}-${counter++}`;
    }

    const { data, error } = await supabase
      .from("categories")
      .insert({
        store_id: storeId,
        name: input.name,
        slug,
        description: input.description || null,
        position: input.displayOrder || 0,
      } as any)
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || "Failed to create category");
    }

    return {
      id: (data as any).id,
      name: (data as any).name,
      slug: (data as any).slug,
      description: (data as any).description || undefined,
      coverImage: undefined,
      status: "published",
      displayOrder: (data as any).position || 0,
      productCount: 0,
      createdAt: (data as any).created_at,
      updatedAt: (data as any).updated_at,
    };
  }

  async update(id: string, input: Partial<Category>, client?: any): Promise<Category | null> {
    const supabase = client || this.getSupabase();
    const { data: rawRow } = await (supabase.from("categories") as any).select("store_id").eq("id", id).maybeSingle();
    if (!rawRow) return null;
    
    await this.checkStoreOwner(rawRow.store_id, supabase);

    const { data, error } = await (supabase.from("categories") as any)
      .update({
        name: input.name,
        slug: input.slug,
        description: input.description,
        position: input.displayOrder,
      })
      .eq("id", id)
      .select()
      .single();

    if (error || !data) return null;

    const row = data as any;
    
    // Get count
    const { count } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("category_id", id);

    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description || undefined,
      coverImage: undefined,
      status: "published",
      displayOrder: row.position || 0,
      productCount: count || 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async delete(id: string, client?: any): Promise<boolean> {
    const supabase = client || this.getSupabase();
    const { data: rawRow } = await (supabase.from("categories") as any).select("store_id").eq("id", id).maybeSingle();
    if (!rawRow) return false;
    
    await this.checkStoreOwner(rawRow.store_id, supabase);

    const { error } = await supabase.from("categories").delete().eq("id", id);
    return !error;
  }

  async reorder(orderedIds: string[], client?: any): Promise<boolean> {
    const supabase = client || this.getSupabase();
    
    // Retrieve the first category to get store_id
    if (orderedIds.length === 0) return true;
    const { data: first } = await (supabase.from("categories") as any).select("store_id").eq("id", orderedIds[0]).single();
    if (!first) return false;
    
    await this.checkStoreOwner(first.store_id, supabase);

    for (let index = 0; index < orderedIds.length; index++) {
      const id = orderedIds[index];
      await (supabase.from("categories") as any)
        .update({ position: index + 1 })
        .eq("id", id);
    }
    return true;
  }

  async duplicate(storeId: string, id: string, client?: any): Promise<Category | null> {
    const supabase = client || this.getSupabase();
    await this.checkStoreOwner(storeId, supabase);
    
    const target = await this.getById(id, supabase);
    if (!target) return null;

    return this.create(storeId, {
      name: `${target.name} (Copy)`,
      slug: `${target.slug}-copy`,
      description: target.description,
      coverImage: target.coverImage,
      status: "draft",
      displayOrder: target.displayOrder + 1,
    });
  }
}

export const supabaseCategoryRepository = new SupabaseCategoryRepository();
