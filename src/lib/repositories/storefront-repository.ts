import { StoreData } from "@/types/store";
import { Product } from "@/types/product";


export type { StoreData };

export interface IStorefrontRepository {
  getStoreBySlug(slug: string, client?: any): Promise<StoreData | null>;
  getProductBySlug(storeSlug: string, productSlug: string, client?: any): Promise<{
    product: Product;
    relatedProducts: Product[];
    store: StoreData;
  } | null>;
}

export { supabaseStorefrontRepository as storefrontRepository } from "./supabase/supabase-storefront-repository";
