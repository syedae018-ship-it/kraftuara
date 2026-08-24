"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { SectionTitle } from "@/components/dashboard/section-title";
import { CategoryForm } from "@/components/categories/category-form";
import { DeleteCategoryModal } from "@/components/categories/delete-category-modal";
import { Category, CreateCategoryInput } from "@/types/category";
import { categoryRepository } from "@/lib/repositories/category-repository";
import { Badge } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit2, ArrowLeft, Trash2, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [category, setCategory] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const data = await categoryRepository.getById(id);
      if (!data) {
        toast.error("Not Found", "Category could not be found.");
        router.push("/dashboard/categories");
        return;
      }
      setCategory(data);
      setIsLoading(false);
    }
    loadData();
  }, [id, router]);

  const handleSubmit = async (data: CreateCategoryInput) => {
    setIsSubmitting(true);
    try {
      await categoryRepository.update(id, data);
      toast.success("Category Updated!", `Saved changes for "${data.name}"`);
      router.push("/dashboard/categories");
    } catch (err) {
      toast.error("Error", "Could not update category.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await categoryRepository.delete(id);
      toast.success("Category Deleted", "Category removed successfully.");
      router.push("/dashboard/categories");
    } catch (err) {
      toast.error("Error", "Could not delete category.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading || !category) {
    return (
      <DashboardLayout breadcrumbs={[{ label: "Categories", href: "/dashboard/categories" }, { label: "Edit Category" }]}>
        <div className="flex items-center justify-center p-12 text-zinc-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-maroon-400" /> Loading category details...
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout breadcrumbs={[{ label: "Categories", href: "/dashboard/categories" }, { label: category.name }]}>
      <SectionTitle
        title={`Edit: ${category.name}`}
        description="Update category name, description, cover image, and SEO meta tags."
        badge={
          <Badge variant="maroon" className="gap-1 font-mono text-[11px]">
            <Edit2 className="w-3 h-3 text-maroon-300" /> Order #{category.displayOrder}
          </Badge>
        }
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/dashboard/categories")}
              leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
            >
              Back
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setDeleteModalOpen(true)}
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            >
              Delete
            </Button>
          </div>
        }
      />

      <div className="max-w-3xl pb-20">
        <CategoryForm initialValues={category} onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      </div>

      <DeleteCategoryModal
        category={category}
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirmDelete={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </DashboardLayout>
  );
}
