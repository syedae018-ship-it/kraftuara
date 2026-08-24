import { Category, CreateCategoryInput, UpdateCategoryInput } from "@/types/category";


export interface ICategoryRepository {
  getAll(storeId: string, client?: any): Promise<Category[]>;
  getById(id: string, client?: any): Promise<Category | null>;
  create(storeId: string, input: CreateCategoryInput, client?: any): Promise<Category>;
  update(id: string, input: UpdateCategoryInput, client?: any): Promise<Category | null>;
  delete(id: string, client?: any): Promise<boolean>;
  reorder(orderedIds: string[], client?: any): Promise<boolean>;
  duplicate(storeId: string, id: string, client?: any): Promise<Category | null>;
}

export { supabaseCategoryRepository as categoryRepository } from "./supabase/supabase-category-repository";
