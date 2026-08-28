import { Product } from "./product";
import { Category } from "./category";
import { Collection } from "./collection";
import { AppearanceSettings } from "./theme";

export type StoreData = {
  id: string;
  name: string;
  slug: string;
  plan?: string; // Resolved from active subscription — "startup" | "growth" | "pro"
  appearance: AppearanceSettings;
  categories: Category[];
  collections: Collection[];
  products: Product[];
  shipping?: {
    freeShippingEnabled: boolean;
    freeShippingThreshold: number;
    shippingFee?: number;
  };
};
