"use client";

import React from "react";
import { Search, LayoutGrid, List, SlidersHorizontal, X } from "lucide-react";
import { ProductFilterState, CategoryOption } from "@/types/product";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface ProductFiltersProps {
  filters: ProductFilterState;
  categories: CategoryOption[];
  onFilterChange: (updated: Partial<ProductFilterState>) => void;
  className?: string;
}

export function ProductFilters({
  filters,
  categories,
  onFilterChange,
  className,
}: ProductFiltersProps) {
  return (
    <div
      className={cn(
        "flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-4 bg-[#151515] border border-white/10 rounded-2xl shadow-card",
        className
      )}
    >
      {/* Search Input */}
      <div className="flex-1 min-w-[240px] relative">
        <Input
          placeholder="Search products by name, SKU, or tag..."
          value={filters.search}
          onChange={(e) => onFilterChange({ search: e.target.value })}
          leftIcon={<Search className="w-4 h-4 text-zinc-500" />}
          rightIcon={
            filters.search ? (
              <button
                onClick={() => onFilterChange({ search: "" })}
                className="text-zinc-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : undefined
          }
        />
      </div>

      {/* Dropdown Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Category Selector */}
        <select
          value={filters.category}
          onChange={(e) => onFilterChange({ category: e.target.value })}
          className="h-10 bg-[#111111] border border-white/10 rounded-xl px-3 text-xs text-white font-body outline-none hover:border-white/20 focus:border-maroon-700 cursor-pointer"
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name} ({cat.itemCount})
            </option>
          ))}
        </select>

        {/* Status Selector */}
        <select
          value={filters.status}
          onChange={(e) => onFilterChange({ status: e.target.value })}
          className="h-10 bg-[#111111] border border-white/10 rounded-xl px-3 text-xs text-white font-body outline-none hover:border-white/20 focus:border-maroon-700 cursor-pointer"
        >
          <option value="all">All Statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="out_of_stock">Out of Stock</option>
          <option value="hidden">Hidden</option>
        </select>

        {/* Sort Selector */}
        <select
          value={filters.sortBy}
          onChange={(e) => onFilterChange({ sortBy: e.target.value as any })}
          className="h-10 bg-[#111111] border border-white/10 rounded-xl px-3 text-xs text-white font-body outline-none hover:border-white/20 focus:border-maroon-700 cursor-pointer"
        >
          <option value="created_desc">Newest First</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="name_asc">Name: A to Z</option>
          <option value="stock_asc">Stock: Low to High</option>
        </select>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-[#111111] border border-white/10 rounded-xl p-1 shrink-0">
          <button
            onClick={() => onFilterChange({ viewMode: "table" })}
            className={cn(
              "p-1.5 rounded-lg transition-colors",
              filters.viewMode === "table"
                ? "bg-maroon-800 text-white shadow-sm"
                : "text-zinc-400 hover:text-white"
            )}
            title="Table View"
            aria-label="Table View"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => onFilterChange({ viewMode: "grid" })}
            className={cn(
              "p-1.5 rounded-lg transition-colors",
              filters.viewMode === "grid"
                ? "bg-maroon-800 text-white shadow-sm"
                : "text-zinc-400 hover:text-white"
            )}
            title="Grid Card View"
            aria-label="Grid Card View"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
