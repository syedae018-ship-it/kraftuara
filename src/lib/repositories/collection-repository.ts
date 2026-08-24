import { Collection, CreateCollectionInput, UpdateCollectionInput } from "@/types/collection";


export interface ICollectionRepository {
  getAll(storeId: string, client?: any): Promise<Collection[]>;
  getById(id: string, client?: any): Promise<Collection | null>;
  create(storeId: string, input: CreateCollectionInput, client?: any): Promise<Collection>;
  update(id: string, input: UpdateCollectionInput, client?: any): Promise<Collection | null>;
  delete(id: string, client?: any): Promise<boolean>;
  reorder(orderedIds: string[], client?: any): Promise<boolean>;
  duplicate(storeId: string, id: string, client?: any): Promise<Collection | null>;
}

export { supabaseCollectionRepository as collectionRepository } from "./supabase/supabase-collection-repository";
