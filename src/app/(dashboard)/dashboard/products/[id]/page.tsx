"use client";

import React, { useState, use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { SectionTitle } from "@/components/dashboard/section-title";
import { ProductForm } from "@/components/products/product-form";
import { PreviewCard } from "@/components/products/preview-card";
import { initialCategories, CategoryOption, Product, ProductImage } from "@/types/product";
import { Badge } from "@/components/ui/table";
import { Edit2, ArrowLeft, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { productRepository } from "@/lib/repositories/product-repository";
import { categoryRepository } from "@/lib/repositories/category-repository";
import { toast } from "@/hooks/use-toast";

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { activeStore } = useAuth();

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [product, setProduct] = useState<Product | null>(null);
  const [liveProduct, setLiveProduct] = useState<Partial<Product>>({});
  const [liveImages, setLiveImages] = useState<ProductImage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const p = await productRepository.getById(id);
        if (p) {
          setProduct(p);
          setLiveProduct(p);
          setLiveImages(p.images);
        } else {
          toast.error("Not Found", "Product not found.");
          router.push("/dashboard/products");
          return;
        }

        if (activeStore?.id) {
          const list = await categoryRepository.getAll(activeStore.id);
          setCategories(
            list.map((c) => ({
              id: c.id,
              name: c.name,
              slug: c.slug,
              itemCount: c.productCount,
            }))
          );
        }
      } catch (err) {
        toast.error("Error", "Failed to load product details.");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id, router, activeStore]);

  const handleAddCategory = (newCat: CategoryOption) => {
    setCategories((prev) => [...prev, newCat]);
  };

  const handleFormChange = (updated: Partial<Product>, updatedImages: ProductImage[]) => {
    setLiveProduct(updated);
    setLiveImages(updatedImages);
  };

  const handleSubmit = async (productData: Partial<Product>) => {
    setIsSubmitting(true);
    try {
      await productRepository.update(id, { ...productData, images: liveImages });
      toast.success("Product Updated!", `Saved changes for "${productData.name}"`);
      router.push("/dashboard/products");
    } catch (err) {
      toast.error("Error", "Failed to save changes.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async () => {
    try {
      await productRepository.delete(id);
      toast.success("Product Deleted", `Removed "${liveProduct.name}" from store catalog.`);
      router.push("/dashboard/products");
    } catch (err) {
      toast.error("Error", "Failed to delete product.");
    }
  };

  if (isLoading || !product) {
    return (
      <DashboardLayout breadcrumbs={[{ label: "Products", href: "/dashboard/products" }, { label: "Loading..." }]}>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-maroon-500" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout breadcrumbs={[{ label: "Products", href: "/dashboard/products" }, { label: product.name }]}>
      <SectionTitle
        title={`Edit: ${product.name}`}
        description="Update pricing, stock availability, product images, and SEO configuration."
        badge={
          <Badge variant="maroon" className="gap-1 font-mono text-[11px]">
            <Edit2 className="w-3 h-3 text-maroon-300" /> SKU: {product.sku}
          </Badge>
        }
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/dashboard/products")}
              leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
            >
              Back
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDeleteProduct}
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            >
              Delete Product
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-20 items-start">
        {/* Form Column */}
        <div className="lg:col-span-7 space-y-6">
          <ProductForm
            initialValues={product}
            categories={categories}
            onAddCategory={handleAddCategory}
            onSubmit={handleSubmit}
            onValuesChange={handleFormChange}
            isSubmitting={isSubmitting}
          />
        </div>

        {/* Live Storefront Preview Column */}
        <div className="lg:col-span-5 hidden lg:block">
          <PreviewCard product={liveProduct} images={liveImages} />
        </div>
      </div>
    </DashboardLayout>
  );
}
