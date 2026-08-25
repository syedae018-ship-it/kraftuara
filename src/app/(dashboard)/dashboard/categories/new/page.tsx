"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { SectionTitle } from "@/components/dashboard/section-title";
import { CategoryForm } from "@/components/categories/category-form";
import { CreateCategoryInput } from "@/types/category";
import { categoryRepository } from "@/lib/repositories/category-repository";
import { Badge } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";

import { useAuth } from "@/context/auth-context";

export default function NewCategoryPage() {
  const router = useRouter();
  const { activeStore } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: CreateCategoryInput) => {
    if (!activeStore?.id) return;
    setIsSubmitting(true);
    try {
      const created = await categoryRepository.create(activeStore.id, data);
      toast.success("Category Created!", `Added category "${created.name}"`);
      router.push("/dashboard/categories");
    } catch (err: any) {
      toast.error("Error", err.message || "Could not create category.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout breadcrumbs={[{ label: "Categories", href: "/dashboard/categories" }, { label: "New Category" }]}>
      <SectionTitle
        title="Add New Category"
        description="Define a new catalog category with cover image, display position, and SEO settings."
        badge={
          <Badge variant="maroon" className="gap-1 font-mono text-[11px]">
            <Plus className="w-3 h-3 text-maroon-300" /> New Taxonomy
          </Badge>
        }
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/dashboard/categories")}
            leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
          >
            Back to Categories
          </Button>
        }
      />

      <div className="max-w-3xl pb-20">
        <CategoryForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      </div>
    </DashboardLayout>
  );
}
