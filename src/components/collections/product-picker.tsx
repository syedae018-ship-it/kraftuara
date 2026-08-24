"use client";

import React, { useState } from "react";
import { Search, Plus, Check, Trash2, ArrowUp, ArrowDown, Package, Layers } from "lucide-react";
import { Product, initialProducts } from "@/types/product";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/products/status-badge";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

export interface ProductPickerProps {
  selectedProductIds: string[];
  onChange: (selectedIds: string[]) => void;
  className?: string;
}

export function ProductPicker({ selectedProductIds, onChange, className }: ProductPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [allProducts] = useState<Product[]>(initialProducts);

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
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-zinc-300 font-heading tracking-wide">
          Collection Products ({selectedProductIds.length})
        </label>
        <span className="text-[11px] text-zinc-500 font-body">
          Reorder items to set display position in collection storefront
        </span>
      </div>

      {/* Selected Products Reorder List */}
      {selectedProducts.length > 0 && (
        <div className="bg-[#111111] border border-white/10 rounded-2xl p-3 space-y-2 max-h-60 overflow-y-auto">
          {selectedProducts.map((product, idx) => {
            const coverImg = product.images.find((i) => i.isCover) || product.images[0];
            return (
              <div
                key={product.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#151515] border border-white/5 hover:border-white/10 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[#111111] border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                    {coverImg ? (
                      <img src={coverImg.url} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-4 h-4 text-zinc-500" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold font-heading text-white truncate">{product.name}</p>
                    <p className="text-[10px] font-mono text-zinc-500">{formatCurrency(product.price)} • SKU: {product.sku}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => moveProduct(idx, "up")}
                    disabled={idx === 0}
                    className="p-1 rounded text-zinc-400 hover:text-white disabled:opacity-30"
                    title="Move Up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveProduct(idx, "down")}
                    disabled={idx === selectedProducts.length - 1}
                    className="p-1 rounded text-zinc-400 hover:text-white disabled:opacity-30"
                    title="Move Down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSelect(product.id)}
                    className="p-1.5 rounded-lg text-red-400 hover:bg-red-950/40 transition-colors ml-1"
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
      <div className="space-y-2">
        <Input
          placeholder="Search catalog products to add to collection..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search className="w-4 h-4 text-zinc-500" />}
        />

        <div className="bg-[#111111] border border-white/10 rounded-xl p-2 max-h-48 overflow-y-auto space-y-1">
          {filteredAvailable.map((p) => {
            const isSelected = selectedProductIds.includes(p.id);
            const coverImg = p.images.find((i) => i.isCover) || p.images[0];

            return (
              <button
                key={p.id}
                type="button"
                onClick={() => toggleSelect(p.id)}
                className={cn(
                  "w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors font-body text-xs",
                  isSelected ? "bg-maroon-950/40 text-white" : "hover:bg-white/5 text-zinc-300"
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded bg-[#151515] overflow-hidden flex items-center justify-center shrink-0 border border-white/5">
                    {coverImg ? (
                      <img src={coverImg.url} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-3.5 h-3.5 text-zinc-600" />
                    )}
                  </div>
                  <div className="truncate">
                    <span className="font-medium text-white">{p.name}</span>
                    <span className="text-[10px] font-mono text-zinc-500 ml-2">{formatCurrency(p.price)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={p.status} className="text-[10px] py-0 px-1.5" />
                  {isSelected ? (
                    <Check className="w-4 h-4 text-maroon-400" />
                  ) : (
                    <Plus className="w-4 h-4 text-zinc-500" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
