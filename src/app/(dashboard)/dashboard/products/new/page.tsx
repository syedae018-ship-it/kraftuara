"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { SectionTitle } from "@/components/dashboard/section-title";
import { ProductForm } from "@/components/products/product-form";
import { PreviewCard } from "@/components/products/preview-card";
import { initialCategories, CategoryOption, Product, ProductImage } from "@/types/product";
import { Badge } from "@/components/ui/table";
import { Plus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { productRepository } from "@/lib/repositories/product-repository";
import { categoryRepository } from "@/lib/repositories/category-repository";
import { PLANS, PlanTier } from "@/lib/feature-gating";

export default function NewProductPage() {
  const router = useRouter();
  const { activeStore, user } = useAuth();
  const [categories, setCategories] = useState<CategoryOption[]>([]);

  const [liveProduct, setLiveProduct] = useState<Partial<Product>>({
    name: "",
    shortDescription: "",
    categoryName: "General",
    price: 0,
    compareAtPrice: 0,
    status: "published",
  });

  const [liveImages, setLiveImages] = useState<ProductImage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    async function loadCategories() {
      if (!activeStore?.id) return;
      try {
        const list = await categoryRepository.getAll(activeStore.id);
        setCategories(
          list.map((c) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            itemCount: c.productCount,
          }))
        );
      } catch (err) {
        console.error("Failed to load categories:", err);
      }
    }
    loadCategories();
  }, [activeStore]);

  const handleAddCategory = (newCat: CategoryOption) => {
    setCategories((prev) => [...prev, newCat]);
  };

  const handleFormChange = (updated: Partial<Product>, updatedImages: ProductImage[]) => {
    setLiveProduct(updated);
    setLiveImages(updatedImages);
  };

  const handleSubmit = async (productData: Partial<Product>) => {
    if (!productData.name || !productData.name.trim()) {
      toast.error("Product Name Required", "Please enter a title for your product.");
      return;
    }

    if (!activeStore?.id) {
      toast.error("No Active Store", "Please make sure you have an active store configured.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Server-side backed validation query
      const { products: pList } = await productRepository.getAll(activeStore.id);
      const planTier = (user?.plan || "startup") as PlanTier;
      const planConfig = PLANS[planTier];
      const limit = planConfig?.productLimit ?? 10;

      if (pList.length >= limit) {
        toast.error(
          "Upgrade Required",
          `You have reached the product limit of your ${planConfig?.name || "Starter"} plan (${limit} products). Please upgrade your plan to add more products.`
        );
        setIsSubmitting(false);
        return;
      }

      await productRepository.create(activeStore.id, {
        name: productData.name.trim(),
        sku: productData.sku || `SKU-${Date.now().toString().slice(-4)}`,
        price: Number(productData.price) || 0,
        compareAtPrice: productData.compareAtPrice ? Number(productData.compareAtPrice) : undefined,
        stock: productData.stock !== undefined ? Number(productData.stock) : 25,
        status: (productData.status as any) || "published",
        categoryId: productData.categoryId || undefined,
        shortDescription: productData.shortDescription || "",
        longDescription: productData.longDescription || "",
        images: liveImages,
      });

      toast.success("Product Saved!", `"${productData.name}" has been added to your store catalog.`);
      router.push("/dashboard/products");
    } catch (err: any) {
      toast.error("Error", err.message || "Failed to add product to catalog.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout breadcrumbs={[{ label: "Products", href: "/dashboard/products" }, { label: "Add New Product" }]}>
      <SectionTitle
        title="Add New Product"
        description="Create a new catalog item with images, pricing, inventory, and SEO."
        badge={
          <Badge variant="maroon" className="gap-1 font-mono text-[11px]">
            <Plus className="w-3 h-3 text-maroon-300" /> New Catalog Item
          </Badge>
        }
        action={
          <Button variant="outline" size="sm" onClick={() => router.back()} leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
            Back to Products
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-20 items-start">
        {/* Main Product Form (8 cols) */}
        <div className="lg:col-span-8">
          <ProductForm
            categories={categories}
            onAddCategory={handleAddCategory}
            onSubmit={handleSubmit}
            onValuesChange={handleFormChange}
            isSubmitting={isSubmitting}
          />
        </div>

        {/* Live Preview Sideboard (4 cols) */}
        <div className="lg:col-span-4 sticky top-6">
          <PreviewCard product={liveProduct} images={liveImages} />
        </div>
      </div>
    </DashboardLayout>
  );
}
