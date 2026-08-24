import { Product } from "./product";

export type CollectionStatus = "published" | "draft" | "archived";

export type CollectionProduct = {
  productId: string;
  displayOrder: number;
  product?: Product;
};

export type Collection = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  coverImage?: string;
  status: CollectionStatus;
  displayOrder: number;
  selectedProductIds: string[];
  productCount: number;
  seoTitle?: string;
  seoDescription?: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateCollectionInput = Omit<Collection, "id" | "productCount" | "createdAt" | "updatedAt">;
export type UpdateCollectionInput = Partial<CreateCollectionInput>;
