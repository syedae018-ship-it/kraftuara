import { Product, ProductFilterState, ProductImage } from "@/types/product";
import { createClient } from "@/lib/supabase/client";
import { IProductRepository } from "../product-repository";
import { PLANS } from "@/lib/feature-gating";

export class SupabaseProductRepository implements IProductRepository {
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
    
    // Fetch subscription details
    const { data: subRow } = await (supabase.from("subscriptions") as any)
      .select("plan, status, current_period_end")
      .eq("store_id", storeId)
      .maybeSingle();

    let plan: "free" | "starter" | "pro" | "business" = "free";
    let status = subRow?.status || "active";
    const expiresAt = subRow?.current_period_end;

    if (subRow) {
      plan = subRow.plan as any;
      if (expiresAt) {
        if (new Date(expiresAt) < new Date()) {
          status = "expired";
        }
      }
    }

    // Downgrade resolved entitlement to free if expired or cancelled
    if (status === "expired" || status === "cancelled") {
      plan = "free";
    }

    // Get limit based on PLANS gating
    const config = PLANS[plan] || PLANS.free;
    const limit = config.productLimit;

    const { count } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("store_id", storeId);
    
    if ((count || 0) >= limit) {
      throw new Error(`Product limit reached. The active plan (${config.name}) restricts you to a maximum of ${limit} products.`);
    }
  }

  private mapProductRow(row: any): Product {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      sku: row.sku,
      price: Number(row.price),
      compareAtPrice: row.compare_at_price ? Number(row.compare_at_price) : undefined,
      stock: row.inventory_count || 0,
      categoryId: row.category_id || "",
      categoryName: row.categories?.name || "General",
      shortDescription: "",
      longDescription: row.description || "",
      status: row.is_published ? "published" : "draft",
      featured: false,
      weight: row.weight ? Number(row.weight) : undefined,
      tags: [],
      seoTitle: "",
      seoDescription: "",
      views: row.views || 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      images: row.product_images
        ? row.product_images
            .sort((a: any, b: any) => (a.position || 0) - (b.position || 0))
            .map((img: any) => ({
              id: img.id,
              url: img.url,
              altText: img.alt_text || undefined,
              position: img.position || 0,
              isCover: img.position === 0,
            }))
        : [],
    };
  }

  async getAll(storeId: string, filter?: ProductFilterState, page: number = 1, limit: number = 50, client?: any): Promise<{ products: Product[]; totalCount: number }> {
    const supabase = client || this.getSupabase();
    let query = supabase
      .from("products")
      .select("*, categories(name), product_images(*)", { count: "exact" })
      .eq("store_id", storeId);

    if (filter?.search) {
      query = query.ilike("name", `%${filter.search}%`);
    }
    if (filter?.category && filter.category !== "all") {
      query = query.eq("category_id", filter.category);
    }
    if (filter?.status && filter.status !== "all") {
      query = query.eq("is_published", filter.status === "published");
    }

    if (filter?.sortBy === "price_asc") {
      query = query.order("price", { ascending: true });
    } else if (filter?.sortBy === "price_desc") {
      query = query.order("price", { ascending: false });
    } else if (filter?.sortBy === "name_asc") {
      query = query.order("name", { ascending: true });
    } else if (filter?.sortBy === "stock_asc") {
      query = query.order("inventory_count", { ascending: true });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const { data, count, error } = await query.range(from, to);

    if (error || !data) {
      return { products: [], totalCount: 0 };
    }

    const mapped = data.map((row: any) => this.mapProductRow(row));
    return { products: mapped, totalCount: count || mapped.length };
  }

  async getById(id: string, client?: any): Promise<Product | null> {
    const supabase = client || this.getSupabase();
    const { data, error } = await supabase
      .from("products")
      .select("*, categories(name), product_images(*)")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) return null;
    return this.mapProductRow(data);
  }

  async create(storeId: string, input: Partial<Product>, client?: any): Promise<Product> {
    const supabase = client || this.getSupabase();
    await this.checkStoreOwner(storeId, supabase);
    await this.checkPlanLimit(storeId, supabase);

    // 1. Unique store-scoped slug generation
    let baseSlug = (input.name || "product")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    
    let slug = baseSlug || "product";
    let counter = 1;
    while (true) {
      const { data } = await supabase
        .from("products")
        .select("id")
        .eq("store_id", storeId)
        .eq("slug", slug)
        .maybeSingle();
      if (!data) break;
      slug = `${baseSlug}-${counter++}`;
    }

    // Validate product price, compareAtPrice, and stock values
    const priceVal = Number(input.price) || 0;
    if (isNaN(priceVal) || !isFinite(priceVal) || priceVal < 0) {
      throw new Error("Invalid product price specified. Price cannot be negative, infinite, or NaN.");
    }
    const compareAtPriceVal = input.compareAtPrice !== undefined && input.compareAtPrice !== null ? Number(input.compareAtPrice) : null;
    if (compareAtPriceVal !== null && (isNaN(compareAtPriceVal) || !isFinite(compareAtPriceVal) || compareAtPriceVal < 0)) {
      throw new Error("Invalid product compare at price specified. Compare at price cannot be negative, infinite, or NaN.");
    }
    const stockVal = input.stock !== undefined ? Number(input.stock) : 0;
    if (isNaN(stockVal) || !isFinite(stockVal) || stockVal < 0) {
      throw new Error("Invalid product stock specified. Stock cannot be negative, infinite, or NaN.");
    }

    // 2. Insert product row
    const { data: productRow, error: productError } = await supabase
      .from("products")
      .insert({
        store_id: storeId,
        name: input.name || "New Product",
        slug,
        sku: input.sku || `SKU-${Date.now()}`,
        price: Number(input.price) || 0,
        compare_at_price: input.compareAtPrice ? Number(input.compareAtPrice) : null,
        inventory_count: input.stock !== undefined ? Number(input.stock) : 0,
        category_id: input.categoryId || null,
        description: input.longDescription || input.shortDescription || "",
        is_published: input.status === "published",
      } as any)
      .select()
      .single();

    if (productError || !productRow) {
      throw new Error(productError?.message || "Failed to create product");
    }

    const createdProductId = (productRow as any).id;

    // 3. Insert product images if any
    if (input.images && input.images.length > 0) {
      const imagePayloads = input.images.map((img, idx) => ({
        product_id: createdProductId,
        store_id: storeId,
        url: img.url,
        alt_text: img.altText || null,
        position: idx,
      }));

      await (supabase.from("product_images") as any).insert(imagePayloads);
    }

    const fullProduct = await this.getById(createdProductId, supabase);
    if (!fullProduct) throw new Error("Created product could not be retrieved");
    return fullProduct;
  }

  async update(id: string, input: Partial<Product>, client?: any): Promise<Product | null> {
    const supabase = client || this.getSupabase();
    
    // Resolve store_id and verify ownership
    const current = await this.getById(id, supabase);
    if (!current) return null;
    
    // Resolve storeId from fetched product
    const { data: rawRow } = await (supabase.from("products") as any).select("store_id").eq("id", id).single();
    const storeId = rawRow?.store_id;
    if (!storeId) return null;
    await this.checkStoreOwner(storeId, supabase);

    // Validate partial product fields
    if (input.price !== undefined) {
      const priceVal = Number(input.price) || 0;
      if (isNaN(priceVal) || !isFinite(priceVal) || priceVal < 0) {
        throw new Error("Invalid product price specified. Price cannot be negative, infinite, or NaN.");
      }
    }
    if (input.compareAtPrice !== undefined && input.compareAtPrice !== null) {
      const compareAtPriceVal = Number(input.compareAtPrice);
      if (isNaN(compareAtPriceVal) || !isFinite(compareAtPriceVal) || compareAtPriceVal < 0) {
        throw new Error("Invalid product compare at price specified. Compare at price cannot be negative, infinite, or NaN.");
      }
    }
    if (input.stock !== undefined) {
      const stockVal = Number(input.stock);
      if (isNaN(stockVal) || !isFinite(stockVal) || stockVal < 0) {
        throw new Error("Invalid product stock specified. Stock cannot be negative, infinite, or NaN.");
      }
    }

    // Update product fields
    const { error: updateError } = await (supabase.from("products") as any)
      .update({
        name: input.name,
        sku: input.sku,
        price: input.price !== undefined ? Number(input.price) : undefined,
        compare_at_price: input.compareAtPrice !== undefined ? (input.compareAtPrice ? Number(input.compareAtPrice) : null) : undefined,
        inventory_count: input.stock !== undefined ? Number(input.stock) : undefined,
        category_id: input.categoryId || null,
        description: input.longDescription !== undefined ? input.longDescription : (input.shortDescription !== undefined ? input.shortDescription : undefined),
        is_published: input.status !== undefined ? (input.status === "published") : undefined,
        updated_at: new Date().toISOString(),
      } as any)
      .eq("id", id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    // Update images if provided in inputs
    if (input.images) {
      // Delete existing
      await (supabase.from("product_images") as any).delete().eq("product_id", id);

      // Insert new
      if (input.images.length > 0) {
        const imagePayloads = input.images.map((img, idx) => ({
          product_id: id,
          store_id: storeId,
          url: img.url,
          alt_text: img.altText || null,
          position: idx,
        }));
        await (supabase.from("product_images") as any).insert(imagePayloads);
      }
    }

    return this.getById(id, supabase);
  }

  async delete(id: string, client?: any): Promise<boolean> {
    const supabase = client || this.getSupabase();
    const { data: rawRow } = await (supabase.from("products") as any).select("store_id").eq("id", id).maybeSingle();
    if (!rawRow) return false;
    
    await this.checkStoreOwner(rawRow.store_id, supabase);

    const { error } = await (supabase.from("products") as any).delete().eq("id", id);
    return !error;
  }

  async bulkDelete(ids: string[], client?: any): Promise<boolean> {
    let success = true;
    for (const id of ids) {
      const deleted = await this.delete(id, client);
      if (!deleted) success = false;
    }
    return success;
  }

  async bulkPublish(ids: string[], client?: any): Promise<boolean> {
    let success = true;
    for (const id of ids) {
      const updated = await this.update(id, { status: "published" }, client);
      if (!updated) success = false;
    }
    return true;
  }

  async bulkUnpublish(ids: string[], client?: any): Promise<boolean> {
    let success = true;
    for (const id of ids) {
      const updated = await this.update(id, { status: "draft" }, client);
      if (!updated) success = false;
    }
    return true;
  }
}

export const supabaseProductRepository = new SupabaseProductRepository();
