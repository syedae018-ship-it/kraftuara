"use client";

import React, { useState } from "react";
import { Product } from "@/types/product";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/products/status-badge";
import { WhatsAppButton } from "./whatsapp-button";
import { formatCurrency } from "@/lib/utils";
import { Package, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

export interface QuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  whatsappPhone?: string;
  storeSlug: string;
}

export function QuickViewModal({ product, isOpen, onClose, whatsappPhone, storeSlug }: QuickViewModalProps) {
  const [selectedImgIndex, setSelectedImgIndex] = useState(0);

  if (!product) return null;

  const activeImage = product.images[selectedImgIndex] || product.images[0];

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-body">
        {/* Gallery Column */}
        <div className="space-y-3">
          <div className="aspect-square rounded-2xl bg-[#111111] border border-white/10 overflow-hidden flex items-center justify-center">
            {activeImage ? (
              <img src={activeImage.url} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <Package className="w-10 h-10 text-zinc-600" />
            )}
          </div>

          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {product.images.map((img, idx) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setSelectedImgIndex(idx)}
                  className={cn(
                    "w-12 h-12 rounded-xl bg-[#111111] border overflow-hidden shrink-0 transition-all",
                    selectedImgIndex === idx ? "border-maroon-500 shadow-glow" : "border-white/10 opacity-70"
                  )}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info Column */}
        <div className="space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-maroon-400 font-heading">
                {product.categoryName}
              </span>
              <StatusBadge status={product.status} />
            </div>

            <h3 className="text-xl font-bold font-heading text-white">{product.name}</h3>
            <span className="text-xs font-mono text-zinc-500 block">SKU: {product.sku}</span>

            <div className="pt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-heading text-white">{formatCurrency(product.price)}</span>
              {product.compareAtPrice && (
                <span className="text-sm font-body text-zinc-500 line-through">
                  {formatCurrency(product.compareAtPrice)}
                </span>
              )}
            </div>

            <p className="text-xs text-zinc-300 font-body leading-relaxed pt-2">
              {product.shortDescription || product.longDescription}
            </p>
          </div>

          <div className="space-y-3 pt-4 border-t border-white/10">
            {["aroma-perfumes", "tech-haven", "creative-threads"].includes(storeSlug) ? (
              <button
                onClick={() => {
                  toast.success("Added to Cart", `${product.name} has been added to your cart.`);
                  onClose();
                }}
                className="w-full h-11 rounded-xl flex items-center justify-center gap-2 text-sm font-bold font-heading bg-maroon-800 hover:bg-maroon-700 text-white transition-colors shadow-glow"
              >
                <Package className="w-4 h-4" /> Buy Now
              </button>
            ) : (
              <WhatsAppButton
                phone={whatsappPhone}
                productName={product.name}
                sku={product.sku}
                price={product.price}
                size="lg"
                className="w-full"
              />
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
