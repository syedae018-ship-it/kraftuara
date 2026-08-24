export type CategoryStatus = "published" | "draft" | "archived";

export type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  coverImage?: string;
  iconImage?: string;
  status: CategoryStatus;
  displayOrder: number;
  productCount: number;
  seoTitle?: string;
  seoDescription?: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateCategoryInput = Omit<Category, "id" | "productCount" | "createdAt" | "updatedAt">;
export type UpdateCategoryInput = Partial<CreateCategoryInput>;
