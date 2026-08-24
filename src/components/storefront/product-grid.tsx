"use client";

import React, { useState, useMemo } from "react";
import { Product } from "@/types/product";
import { Category } from "@/types/category";
import { Collection } from "@/types/collection";
import { StoreProductCard } from "./store-product-card";
import { QuickViewModal } from "./quick-view-modal";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { Search, SlidersHorizontal, Package, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ProductGridProps {
  products: Product[];
  categories: Category[];
  collections: Collection[];
  storeSlug: string;
  whatsappPhone?: string;
  initialCategory?: string;
  initialCollection?: string;
  className?: string;
  isSubdomain?: boolean;
}

export function ProductGrid({
  products,
  categories,
  collections,
  storeSlug,
  whatsappPhone,
  initialCategory = "all",
  initialCollection = "all",
  className,
  isSubdomain = false,
}: ProductGridProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedCollection, setSelectedCollection] = useState(initialCollection);
  const [sortBy, setSortBy] = useState<"featured" | "price_asc" | "price_desc" | "name_asc">("featured");
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matchesSearch =
          !search ||
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.sku.toLowerCase().includes(search.toLowerCase()) ||
          p.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));

        const matchesCategory = selectedCategory === "all" || p.categoryId === selectedCategory;

        let matchesCollection = true;
        if (selectedCollection !== "all") {
          const col = collections.find((c) => c.id === selectedCollection);
          matchesCollection = Boolean(col && col.selectedProductIds.includes(p.id));
        }

        return matchesSearch && matchesCategory && matchesCollection;
      })
      .sort((a, b) => {
        if (sortBy === "price_asc") return a.price - b.price;
        if (sortBy === "price_desc") return b.price - a.price;
        if (sortBy === "name_asc") return a.name.localeCompare(b.name);
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      });
  }, [products, categories, collections, search, selectedCategory, selectedCollection, sortBy]);

  return (
    <section id="products" className={cn("py-12 px-4 lg:px-8 space-y-6 max-w-7xl mx-auto", className)}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-xl font-bold font-heading text-white tracking-tight">Full Fragrance Catalog</h2>
          <p className="text-xs text-zinc-400 font-body mt-0.5">Explore our complete range of attars and perfumes</p>
        </div>
        <span className="text-xs font-mono text-zinc-400 font-semibold">{filteredProducts.length} Products</span>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-4 bg-[#151515] border border-white/10 rounded-2xl shadow-card">
        <div className="flex-1 min-w-[240px]">
          <Input
            placeholder="Search products by title, SKU, or notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-zinc-500" />}
            rightIcon={
              search ? (
                <button onClick={() => setSearch("")} className="text-zinc-500 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : undefined
            }
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-10 bg-[#111111] border border-white/10 rounded-xl px-3 text-xs text-white font-body outline-none hover:border-white/20 focus:border-maroon-700 cursor-pointer"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.productCount})
              </option>
            ))}
          </select>

          {/* Collection Filter */}
          {collections.length > 0 && (
            <select
              value={selectedCollection}
              onChange={(e) => setSelectedCollection(e.target.value)}
              className="h-10 bg-[#111111] border border-white/10 rounded-xl px-3 text-xs text-white font-body outline-none hover:border-white/20 focus:border-maroon-700 cursor-pointer"
            >
              <option value="all">All Collections</option>
              {collections.map((col) => (
                <option key={col.id} value={col.id}>
                  {col.name} ({col.productCount})
                </option>
              ))}
            </select>
          )}

          {/* Sort By Selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="h-10 bg-[#111111] border border-white/10 rounded-xl px-3 text-xs text-white font-body outline-none hover:border-white/20 focus:border-maroon-700 cursor-pointer"
          >
            <option value="featured">Featured First</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="name_asc">Name: A to Z</option>
          </select>
        </div>
      </div>

      {/* Product Grid / Empty State */}
      {filteredProducts.length === 0 ? (
        <EmptyState
          icon={<Package className="w-8 h-8 text-maroon-400" />}
          title={products.length === 0 ? "No products yet" : "No products found"}
          description={
            products.length === 0
              ? "This store has not published any items to its catalog yet."
              : "Try clearing your search term or category filters."
          }
          action={
            products.length > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setSelectedCategory("all");
                  setSelectedCollection("all");
                }}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-heading text-xs font-bold transition-colors"
              >
                Clear Filters
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
          {filteredProducts.map((p) => (
            <StoreProductCard
              key={p.id}
              product={p}
              storeSlug={storeSlug}
              whatsappPhone={whatsappPhone}
              onQuickView={setQuickViewProduct}
              isSubdomain={isSubdomain}
            />
          ))}
        </div>
      )}

      {/* Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        isOpen={Boolean(quickViewProduct)}
        onClose={() => setQuickViewProduct(null)}
        whatsappPhone={whatsappPhone}
        storeSlug={storeSlug}
      />
    </section>
  );
}
