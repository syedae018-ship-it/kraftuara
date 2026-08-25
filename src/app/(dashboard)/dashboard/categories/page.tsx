"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { SectionTitle } from "@/components/dashboard/section-title";
import { CategoryTable } from "@/components/categories/category-table";
import { CategoryCard } from "@/components/categories/category-card";
import { DeleteCategoryModal } from "@/components/categories/delete-category-modal";
import { ProductGridSkeleton, ProductTableSkeleton } from "@/components/products/product-skeletons";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/table";
import { Category } from "@/types/category";
import { categoryRepository } from "@/lib/repositories/category-repository";
import { Plus, Folder, Search, List, LayoutGrid, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";
import { PLANS, PlanTier } from "@/lib/feature-gating";

export default function CategoryListPage() {
  const { activeStore, user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [isLoading, setIsLoading] = useState(true);

  // Delete Safety Modal state
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCategories = async () => {
    if (!activeStore?.id) return;
    setIsLoading(true);
    try {
      const data = await categoryRepository.getAll(activeStore.id);
      setCategories(data);
    } catch (err) {
      toast.error("Error", "Failed to load catalog categories.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [activeStore]);

  const filteredCategories = useMemo(() => {
    return categories.filter((cat) => {
      const matchesSearch =
        !search ||
        cat.name.toLowerCase().includes(search.toLowerCase()) ||
        cat.slug.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || cat.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [categories, search, statusFilter]);

  // Actions
  const handleDuplicate = async (id: string) => {
    if (!activeStore?.id) return;
    const duplicated = await categoryRepository.duplicate(activeStore.id, id);
    if (duplicated) {
      toast.success("Category Duplicated", `Created copy "${duplicated.name}"`);
      fetchCategories();
    }
  };

  const handleTogglePublish = async (id: string) => {
    const target = categories.find((c) => c.id === id);
    if (!target) return;

    const nextStatus = target.status === "published" ? "draft" : "published";
    await categoryRepository.update(id, { status: nextStatus });
    toast.info("Status Updated", `Changed status to ${nextStatus}.`);
    fetchCategories();
  };

  const handleArchive = async (id: string) => {
    await categoryRepository.update(id, { status: "archived" });
    toast.info("Category Archived", "Moved category status to Archived.");
    fetchCategories();
  };

  const handleConfirmDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      await categoryRepository.delete(id);
      toast.success("Category Deleted", "Category removed successfully.");
      setDeletingCategory(null);
      fetchCategories();
    } catch (err) {
      toast.error("Error", "Could not delete category.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMoveOrder = async (id: string, direction: "up" | "down") => {
    const idx = categories.findIndex((c) => c.id === id);
    if (idx === -1) return;
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= categories.length) return;

    const updated = [...categories];
    const temp = updated[idx];
    updated[idx] = updated[targetIdx];
    updated[targetIdx] = temp;

    setCategories(updated);
    await categoryRepository.reorder(updated.map((c) => c.id));
  };

  const planTier = (user?.plan || "startup") as PlanTier;
  const planConfig = PLANS[planTier] || PLANS.startup;
  const categoryLimit = planConfig.categoryLimit;
  const limitDisplay = categoryLimit > 1000 ? "unlimited" : categoryLimit.toString();

  return (
    <DashboardLayout breadcrumbs={[{ label: "Store Dashboard", href: "/dashboard" }, { label: "Categories" }]}>
      <SectionTitle
        title="Category Management"
        description="Organize your store products into structured taxonomy categories."
        badge={
          <Badge variant="maroon" className="gap-1 font-mono text-[11px]">
            <Folder className="w-3 h-3 text-maroon-300" /> {categories.length} of {limitDisplay} categories used
          </Badge>
        }
        action={
          <div className="flex items-center gap-2">
            {categories.length >= categoryLimit ? (
              <Link href="/dashboard/billing">
                <Button variant="outline" size="sm" className="border-amber-500 text-amber-500 hover:bg-amber-950/20 text-xs" leftIcon={<Plus className="w-3.5 h-3.5" />}>
                  Upgrade to Add More
                </Button>
              </Link>
            ) : (
              <Link href="/dashboard/categories/new">
                <Button variant="primary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
                  Add Category
                </Button>
              </Link>
            )}
          </div>
        }
      />

      <div className="space-y-6 pb-20">
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-4 bg-[#151515] border border-white/10 rounded-2xl shadow-card">
          <div className="flex-1 min-w-[240px]">
            <Input
              placeholder="Search categories by name or slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-zinc-500" />}
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 bg-[#111111] border border-white/10 rounded-xl px-3 text-xs text-white font-body outline-none hover:border-white/20 focus:border-maroon-700 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>

            <div className="flex items-center bg-[#111111] border border-white/10 rounded-xl p-1 shrink-0">
              <button
                onClick={() => setViewMode("table")}
                className={cn(
                  "p-1.5 rounded-lg transition-colors",
                  viewMode === "table" ? "bg-maroon-800 text-white shadow-sm" : "text-zinc-400 hover:text-white"
                )}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-1.5 rounded-lg transition-colors",
                  viewMode === "grid" ? "bg-maroon-800 text-white shadow-sm" : "text-zinc-400 hover:text-white"
                )}
                title="Grid Card View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* List Content */}
        {isLoading ? (
          viewMode === "table" ? <ProductTableSkeleton rows={4} /> : <ProductGridSkeleton count={4} />
        ) : filteredCategories.length === 0 ? (
          <EmptyState
            icon={<Folder className="w-8 h-8 text-maroon-400" />}
            title="Organize your catalog"
            description="Create categories to help customers navigate through your product collections easily."
            action={
              <Link href="/dashboard/categories/new">
                <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
                  Create First Category
                </Button>
              </Link>
            }
          />
        ) : viewMode === "table" ? (
          <CategoryTable
            categories={filteredCategories}
            onDuplicate={handleDuplicate}
            onTogglePublish={handleTogglePublish}
            onArchive={handleArchive}
            onDeleteRequest={setDeletingCategory}
            onMoveUp={(id) => handleMoveOrder(id, "up")}
            onMoveDown={(id) => handleMoveOrder(id, "down")}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCategories.map((cat) => (
              <CategoryCard
                key={cat.id}
                category={cat}
                onDuplicate={handleDuplicate}
                onTogglePublish={handleTogglePublish}
                onArchive={handleArchive}
                onDeleteRequest={setDeletingCategory}
                onMoveUp={(id) => handleMoveOrder(id, "up")}
                onMoveDown={(id) => handleMoveOrder(id, "down")}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete Safety Confirmation Modal */}
      <DeleteCategoryModal
        category={deletingCategory}
        isOpen={Boolean(deletingCategory)}
        onClose={() => setDeletingCategory(null)}
        onConfirmDelete={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </DashboardLayout>
  );
}
