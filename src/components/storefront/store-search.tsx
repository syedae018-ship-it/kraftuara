"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, X, Package, ArrowRight } from "lucide-react";
import { Product } from "@/types/product";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import { getStoreBasePath } from "@/lib/urls";

export interface StoreSearchProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  storeSlug: string;
  isSubdomain?: boolean;
}

export function StoreSearch({ isOpen, onClose, products, storeSlug, isSubdomain = false }: StoreSearchProps) {
  const pathname = usePathname();
  const isDemo = pathname?.startsWith("/demo");
  const demoTheme = pathname?.split("/")[2] || "luxury";
  const storePrefix = getStoreBasePath(storeSlug, isSubdomain, isDemo, demoTheme);

  const [query, setQuery] = useState("");

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    p.sku.toLowerCase().includes(query.toLowerCase()) ||
    p.tags.some((t) => t.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="lg">
      <div className="space-y-4 font-body">
        <Input
          placeholder="Search perfumes, attar oils, bakhoor..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          leftIcon={<Search className="w-4 h-4 text-zinc-500" />}
          autoFocus
        />

        <div className="space-y-1.5 max-h-80 overflow-y-auto">
          {query.trim() && filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-500 font-body">
              No products found matching &quot;{query}&quot;.
            </div>
          ) : (
            filtered.map((p) => {
              const coverImg = p.images.find((i) => i.isCover) || p.images[0];

              return (
                <Link
                  key={p.id}
                  href={`${storePrefix}/product/${p.slug}`}
                  onClick={onClose}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/10 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#111111] border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                      {coverImg ? (
                        <img src={coverImg.url} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-4 h-4 text-zinc-600" />
                      )}
                    </div>
                    <div>
                      <h5 className="text-xs font-semibold font-heading text-white group-hover:text-maroon-300 transition-colors">
                        {p.name}
                      </h5>
                      <span className="text-[10px] font-mono text-zinc-500">{formatCurrency(p.price)}</span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-white transition-colors" />
                </Link>
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
}
