import { Product, ProductFilterState } from "@/types/product";


export interface IProductRepository {
  getAll(storeId: string, filter?: ProductFilterState, page?: number, limit?: number, client?: any): Promise<{ products: Product[]; totalCount: number }>;
  getById(id: string, client?: any): Promise<Product | null>;
  create(storeId: string, input: Partial<Product>, client?: any): Promise<Product>;
  update(id: string, input: Partial<Product>, client?: any): Promise<Product | null>;
  delete(id: string, client?: any): Promise<boolean>;
  bulkDelete(ids: string[], client?: any): Promise<boolean>;
  bulkPublish(ids: string[], client?: any): Promise<boolean>;
  bulkUnpublish(ids: string[], client?: any): Promise<boolean>;
}

export { supabaseProductRepository as productRepository } from "./supabase/supabase-product-repository";
