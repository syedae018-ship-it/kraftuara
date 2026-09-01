"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { SectionTitle } from "@/components/dashboard/section-title";
import { ProductFilters } from "@/components/products/product-filters";
import { ProductTable } from "@/components/products/product-table";
import { ProductCard } from "@/components/products/product-card";
import { BulkToolbar } from "@/components/products/bulk-toolbar";
import { ProductGridSkeleton, ProductTableSkeleton } from "@/components/products/product-skeletons";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/table";
import { Product, ProductFilterState, initialCategories, CategoryOption } from "@/types/product";
import { Plus, Package, Sparkles, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { productRepository } from "@/lib/repositories/product-repository";
import { categoryRepository } from "@/lib/repositories/category-repository";
import { PLANS, PlanTier, getProductLimit, getPlanConfig, normalizePlanTier, canCreateProduct } from "@/lib/feature-gating";

export default function ProductListPage() {
  const { activeStore, user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProducts = async () => {
    if (!activeStore?.id) return;
    setIsLoading(true);
    try {
      const [{ products: data }, list] = await Promise.all([
        productRepository.getAll(activeStore.id),
        categoryRepository.getAll(activeStore.id),
      ]);
      setProducts(data || []);
      setCategories(
        (list || []).map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          itemCount: c.productCount,
        }))
      );
    } catch (err) {
      console.error("Failed to fetch products and categories:", err);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchProducts();
  }, [activeStore?.id]);

  const [filters, setFilters] = useState<ProductFilterState>({
    search: "",
    category: "all",
    status: "all",
    sortBy: "created_desc",
    viewMode: "table",
  });

  // Filter and Sort Logic
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matchesSearch =
          !filters.search ||
          p.name.toLowerCase().includes(filters.search.toLowerCase()) ||
          p.sku.toLowerCase().includes(filters.search.toLowerCase()) ||
          p.tags.some((t) => t.toLowerCase().includes(filters.search.toLowerCase()));

        const matchesCategory = filters.category === "all" || p.categoryId === filters.category;
        const matchesStatus = filters.status === "all" || p.status === filters.status;

        return matchesSearch && matchesCategory && matchesStatus;
      })
      .sort((a, b) => {
        if (filters.sortBy === "price_asc") return a.price - b.price;
        if (filters.sortBy === "price_desc") return b.price - a.price;
        if (filters.sortBy === "name_asc") return a.name.localeCompare(b.name);
        if (filters.sortBy === "stock_asc") return a.stock - b.stock;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [products, filters]);

  // Selection Handlers
  const handleSelectToggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllToggle = () => {
    if (selectedIds.length === filteredProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProducts.map((p) => p.id));
    }
  };

  // Product Actions
  const handleDuplicate = async (id: string) => {
    if (!activeStore?.id) return;
    const target = products.find((p) => p.id === id);
    if (!target) return;

    const check = canCreateProduct(activeStore?.plan || user?.plan, products.length);
    if (!check.allowed) {
      toast.error(
        "Product Limit Reached",
        check.message || "You've reached your plan's product limit. Upgrade your plan to add more products."
      );
      return;
    }

    try {
      await productRepository.create(activeStore.id, {
        name: `${target.name} (Copy)`,
        sku: `${target.sku}-COPY`,
        price: target.price,
        compareAtPrice: target.compareAtPrice,
        stock: target.stock,
        categoryId: target.categoryId,
        categoryName: target.categoryName,
        shortDescription: target.shortDescription,
        longDescription: target.longDescription,
        status: "draft",
        tags: target.tags,
        featured: target.featured,
      });
      toast.success("Product Duplicated", `Created copy of "${target.name}"`);
      fetchProducts();
    } catch (err: any) {
      toast.error("Error", err.message || "Failed to duplicate product.");
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await productRepository.update(id, { status: "hidden" as any });
      toast.info("Product Archived", "Moved item status to Hidden.");
      fetchProducts();
    } catch (err) {
      toast.error("Error", "Failed to archive product.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await productRepository.delete(id);
      setSelectedIds((prev) => prev.filter((i) => i !== id));
      toast.success("Product Deleted", "Removed item from catalog.");
      fetchProducts();
    } catch (err) {
      toast.error("Error", "Failed to delete product.");
    }
  };

  // Bulk Actions
  const handleBulkPublish = async () => {
    try {
      await productRepository.bulkPublish(selectedIds);
      toast.success("Bulk Published", `Published ${selectedIds.length} item(s).`);
      setSelectedIds([]);
      fetchProducts();
    } catch (err) {
      toast.error("Error", "Failed to bulk publish products.");
    }
  };

  const handleBulkUnpublish = async () => {
    try {
      await productRepository.bulkUnpublish(selectedIds);
      toast.info("Bulk Drafted", `Unpublished ${selectedIds.length} item(s).`);
      setSelectedIds([]);
      fetchProducts();
    } catch (err) {
      toast.error("Error", "Failed to bulk unpublish products.");
    }
  };

  const handleBulkDelete = async () => {
    try {
      await productRepository.bulkDelete(selectedIds);
      toast.success("Bulk Deleted", `Deleted ${selectedIds.length} item(s).`);
      setSelectedIds([]);
      fetchProducts();
    } catch (err) {
      toast.error("Error", "Failed to bulk delete products.");
    }
  };

  const planTier = normalizePlanTier(activeStore?.plan || user?.plan);
  const productLimit = getProductLimit(planTier);

  return (
    <DashboardLayout breadcrumbs={[{ label: "Store Dashboard", href: "/dashboard" }, { label: "Products" }]}>
      {/* Page Title & Actions */}
      <SectionTitle
        title="Product Catalog"
        description="Manage your online store products, pricing, stock levels, and media."
        badge={
          <Badge variant="maroon" className="gap-1 font-mono text-[11px]">
            <Package className="w-3 h-3 text-maroon-300" /> {products.length} of {productLimit} products used
          </Badge>
        }
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsLoading(!isLoading)}
              leftIcon={<Loader2 className={isLoading ? "w-3.5 h-3.5 animate-spin text-maroon-400" : "w-3.5 h-3.5"} />}
            >
              {isLoading ? "Show Data" : "Preview Skeletons"}
            </Button>
            {products.length >= productLimit ? (
              <Link href="/dashboard/billing">
                <Button variant="outline" size="sm" className="border-amber-500 text-amber-500 hover:bg-amber-950/20 text-xs" leftIcon={<Plus className="w-3.5 h-3.5" />}>
                  Upgrade to Add More
                </Button>
              </Link>
            ) : (
              <Link href="/dashboard/products/new">
                <Button variant="primary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
                  Add Product
                </Button>
              </Link>
            )}
          </div>
        }
      />

      <div className="space-y-6 pb-20">
        {/* Filter Toolbar */}
        <ProductFilters
          filters={filters}
          categories={categories}
          onFilterChange={(updated) => setFilters((prev) => ({ ...prev, ...updated }))}
        />

        {/* Content Body / Loading Skeletons */}
        {isLoading ? (
          filters.viewMode === "table" ? (
            <ProductTableSkeleton rows={5} />
          ) : (
            <ProductGridSkeleton count={6} />
          )
        ) : filteredProducts.length === 0 ? (
          <EmptyState
            icon={<Package className="w-8 h-8 text-maroon-400" />}
            title="Your catalog is empty"
            description={
              filters.search || filters.category !== "all" || filters.status !== "all"
                ? "No products match your current search and filter parameters."
                : "You have not added any products to your store catalog yet."
            }
            action={
              <Link href="/dashboard/products/new">
                <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
                  Add First Product
                </Button>
              </Link>
            }
          />
        ) : filters.viewMode === "table" ? (
          <ProductTable
            products={filteredProducts}
            selectedIds={selectedIds}
            onSelectToggle={handleSelectToggle}
            onSelectAllToggle={handleSelectAllToggle}
            onDuplicate={handleDuplicate}
            onArchive={handleArchive}
            onDelete={handleDelete}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                selected={selectedIds.includes(p.id)}
                onSelectToggle={handleSelectToggle}
                onDuplicate={handleDuplicate}
                onArchive={handleArchive}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {/* Pagination Footer */}
        {filteredProducts.length > 0 && !isLoading && (
          <div className="flex items-center justify-between pt-4 border-t border-white/10 text-xs text-zinc-400 font-body">
            <span>
              Showing <strong className="text-white">1</strong> to <strong className="text-white">{filteredProducts.length}</strong> of{" "}
              <strong className="text-white">{products.length}</strong> products
            </span>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" disabled leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled rightIcon={<ChevronRight className="w-3.5 h-3.5" />}>
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Floating Bulk Actions Bar */}
      <BulkToolbar
        selectedCount={selectedIds.length}
        onBulkPublish={handleBulkPublish}
        onBulkUnpublish={handleBulkUnpublish}
        onBulkDelete={handleBulkDelete}
        onClearSelection={() => setSelectedIds([])}
      />
    </DashboardLayout>
  );
}
