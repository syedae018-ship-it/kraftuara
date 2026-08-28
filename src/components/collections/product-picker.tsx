"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Plus, Check, Trash2, ArrowUp, ArrowDown, Package, Loader2, AlertCircle } from "lucide-react";
import { Product } from "@/types/product";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/products/status-badge";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { productRepository } from "@/lib/repositories/product-repository";
import { useAuth } from "@/context/auth-context";

export interface ProductPickerProps {
  storeId?: string;
  products?: Product[];
  selectedProductIds: string[];
  onChange: (selectedIds: string[]) => void;
  className?: string;
}

export function ProductPicker({
  storeId: explicitStoreId,
  products: initialProductList,
  selectedProductIds,
  onChange,
  className,
}: ProductPickerProps) {
  const { activeStore } = useAuth();
  const storeId = explicitStoreId || activeStore?.id;

  const [searchQuery, setSearchQuery] = useState("");
  const [allProducts, setAllProducts] = useState<Product[]>(initialProductList || []);
  const [isLoading, setIsLoading] = useState<boolean>(!initialProductList && Boolean(storeId));

  useEffect(() => {
    if (initialProductList) {
      setAllProducts(initialProductList);
      setIsLoading(false);
      return;
    }

    if (!storeId) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    async function fetchProducts() {
      setIsLoading(true);
      try {
        const { products } = await productRepository.getAll(storeId!, undefined, 1, 1000);
        if (isMounted) {
          setAllProducts(products || []);
        }
      } catch (err) {
        console.error("Failed to load store products for collection:", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchProducts();

    return () => {
      isMounted = false;
    };
  }, [storeId, initialProductList]);

  const selectedProducts = selectedProductIds
    .map((id) => allProducts.find((p) => p.id === id))
    .filter((p): p is Product => p !== undefined);

  const filteredAvailable = allProducts.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSelect = (id: string) => {
    if (selectedProductIds.includes(id)) {
      onChange(selectedProductIds.filter((i) => i !== id));
    } else {
      onChange([...selectedProductIds, id]);
    }
  };

  const moveProduct = (index: number, direction: "up" | "down") => {
    const newIdx = direction === "up" ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= selectedProductIds.length) return;

    const updated = [...selectedProductIds];
    const temp = updated[index];
    updated[index] = updated[newIdx];
    updated[newIdx] = temp;

    onChange(updated);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <label className="text-xs font-semibold text-zinc-300 font-heading tracking-wide">
          Collection Products ({selectedProductIds.length})
        </label>
        <span className="text-[11px] text-zinc-500 font-body">
          Select real store products and set their display order
        </span>
      </div>

      {/* Selected Products Reorder List */}
      {selectedProducts.length > 0 && (
        <div className="bg-[#111111] border border-white/10 rounded-2xl p-3 space-y-2 max-h-60 overflow-y-auto">
          {selectedProducts.map((product, idx) => {
            const coverImg = product.images?.find((i) => i.isCover) || product.images?.[0];
            return (
              <div
                key={product.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#151515] border border-white/5 hover:border-white/10 transition-colors gap-2"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-lg bg-[#111111] border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                    {coverImg?.url ? (
                      <img src={coverImg.url} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-4 h-4 text-zinc-500" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold font-heading text-white truncate">{product.name}</p>
                    <p className="text-[10px] font-mono text-zinc-400">
                      {formatCurrency(product.price)} {product.sku ? `• SKU: ${product.sku}` : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => moveProduct(idx, "up")}
                    disabled={idx === 0}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent"
                    title="Move Up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveProduct(idx, "down")}
                    disabled={idx === selectedProducts.length - 1}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent"
                    title="Move Down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSelect(product.id)}
                    className="p-1.5 rounded-lg text-red-400 hover:bg-red-950/40 transition-colors ml-0.5"
                    title="Remove from Collection"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Available Product Search & Selector */}
      {isLoading ? (
        <div className="p-8 border border-white/10 rounded-2xl bg-[#111111] flex flex-col items-center justify-center text-center space-y-2 text-zinc-400">
          <Loader2 className="w-5 h-5 animate-spin text-maroon-400" />
          <p className="text-xs font-body">Loading store catalog products...</p>
        </div>
      ) : allProducts.length === 0 ? (
        <div className="p-6 border border-white/10 rounded-2xl bg-[#111111] flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-10 h-10 rounded-xl bg-maroon-950/50 border border-maroon-800/40 flex items-center justify-center text-maroon-300">
            <Package className="w-5 h-5" />
          </div>
          <div className="space-y-1 max-w-sm">
            <p className="text-xs font-semibold text-white font-heading">No products available</p>
            <p className="text-[11px] text-zinc-400 font-body">
              Add products to your store before creating a collection.
            </p>
          </div>
          <Link href="/dashboard/products/new">
            <Button variant="outline" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
              Add Product to Store
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          <Input
            placeholder="Search catalog products to add to collection..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-zinc-500" />}
          />

          <div className="bg-[#111111] border border-white/10 rounded-xl p-2 max-h-56 overflow-y-auto space-y-1">
            {filteredAvailable.length === 0 ? (
              <div className="p-4 text-center text-xs text-zinc-500 font-body">
                No products match &ldquo;{searchQuery}&rdquo;
              </div>
            ) : (
              filteredAvailable.map((p) => {
                const isSelected = selectedProductIds.includes(p.id);
                const coverImg = p.images?.find((i) => i.isCover) || p.images?.[0];

                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggleSelect(p.id)}
                    className={cn(
                      "w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors font-body text-xs gap-2",
                      isSelected ? "bg-maroon-950/40 border border-maroon-800/40 text-white" : "hover:bg-white/5 border border-transparent text-zinc-300"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-7 h-7 rounded bg-[#151515] overflow-hidden flex items-center justify-center shrink-0 border border-white/5">
                        {coverImg?.url ? (
                          <img src={coverImg.url} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-3.5 h-3.5 text-zinc-600" />
                        )}
                      </div>
                      <div className="truncate flex-1 min-w-0">
                        <span className="font-medium text-white block truncate">{p.name}</span>
                        <span className="text-[10px] font-mono text-zinc-400">{formatCurrency(p.price)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge status={p.status} className="text-[10px] py-0 px-1.5 hidden xs:inline-flex" />
                      {isSelected ? (
                        <div className="w-5 h-5 rounded-md bg-maroon-600/30 border border-maroon-500/50 flex items-center justify-center text-maroon-300">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-md bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white">
                          <Plus className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

