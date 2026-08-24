"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  MoreVertical,
  Edit2,
  Copy,
  Eye,
  Archive,
  Trash2,
  Check,
  Package,
  Sparkles,
} from "lucide-react";
import { Product } from "@/types/product";
import { StatusBadge } from "./status-badge";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

export interface ProductCardProps {
  product: Product;
  selected?: boolean;
  onSelectToggle?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onArchive?: (id: string) => void;
  onDelete?: (id: string) => void;
  className?: string;
}

export function ProductCard({
  product,
  selected = false,
  onSelectToggle,
  onDuplicate,
  onArchive,
  onDelete,
  className,
}: ProductCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const coverImage = product.images.find((img) => img.isCover) || product.images[0];

  return (
    <motion.div
      whileHover={{ y: -3 }}
      className={cn(
        "group relative bg-[#151515] border rounded-2xl overflow-hidden transition-all duration-200 shadow-card flex flex-col justify-between",
        selected
          ? "border-maroon-500 shadow-glow bg-[#181818]"
          : "border-white/10 hover:border-white/20 hover:bg-[#181818]",
        className
      )}
    >
      {/* Checkbox Overlay Top-Left */}
      <div className="absolute top-3 left-3 z-10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelectToggle?.(product.id);
          }}
          className={cn(
            "w-5 h-5 rounded-md border flex items-center justify-center transition-all",
            selected
              ? "bg-maroon-800 border-maroon-600 text-white"
              : "bg-black/60 border-white/20 text-transparent hover:border-white/40 opacity-0 group-hover:opacity-100"
          )}
          aria-label="Select product"
        >
          <Check className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Action Menu Top-Right */}
      <div className="absolute top-3 right-3 z-10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen(!menuOpen);
          }}
          className="p-1.5 rounded-lg bg-black/60 border border-white/10 text-zinc-300 hover:text-white hover:bg-black/80 transition-colors"
          aria-label="Product actions"
        >
          <MoreVertical className="w-4 h-4" />
        </button>

        <AnimatePresence>
          {menuOpen && (
            <>
              <div onClick={() => setMenuOpen(false)} className="fixed inset-0 z-40" />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 5 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-8 z-50 w-44 bg-[#151515] border border-white/10 rounded-xl shadow-2xl p-1 font-body text-xs space-y-0.5 backdrop-blur-xl"
              >
                <Link
                  href={`/dashboard/products/${product.id}`}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5 text-zinc-400" /> Edit Product
                </Link>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onDuplicate?.(product.id);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-white/5 transition-colors text-left"
                >
                  <Copy className="w-3.5 h-3.5 text-zinc-400" /> Duplicate
                </button>
                <a
                  href={`/store/${product.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5 text-zinc-400" /> Preview
                </a>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onArchive?.(product.id);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-white/5 transition-colors text-left"
                >
                  <Archive className="w-3.5 h-3.5 text-zinc-400" /> Archive
                </button>
                <div className="border-t border-white/10 my-0.5" />
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete?.(product.id);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-red-400 hover:bg-red-950/40 transition-colors text-left"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Image Thumbnail Container */}
      <div className="relative aspect-square w-full bg-[#111111] border-b border-white/5 overflow-hidden flex items-center justify-center">
        {coverImage ? (
          <img
            src={coverImage.url}
            alt={coverImage.altText || product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <Package className="w-10 h-10 text-zinc-600" />
        )}

        {/* Featured Badge */}
        {product.featured && (
          <div className="absolute bottom-3 left-3 bg-maroon-950/80 border border-maroon-600/50 rounded-md px-2 py-0.5 text-[10px] font-bold font-heading text-maroon-300 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-maroon-400" /> Featured
          </div>
        )}
      </div>

      {/* Card Content Body */}
      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 font-heading">
              {product.categoryName}
            </span>
            <StatusBadge status={product.status} />
          </div>
          <Link href={`/dashboard/products/${product.id}`}>
            <h3 className="text-sm font-semibold font-heading text-white hover:text-maroon-300 transition-colors line-clamp-1">
              {product.name}
            </h3>
          </Link>
          <p className="text-xs text-zinc-400 font-body line-clamp-2 leading-relaxed">
            {product.shortDescription}
          </p>
        </div>

        {/* Card Footer: Price & Stock */}
        <div className="pt-3 border-t border-white/5 flex items-center justify-between">
          <div>
            <span className="text-base font-bold font-heading text-white">
              {formatCurrency(product.price)}
            </span>
            {product.compareAtPrice && (
              <span className="text-xs font-body text-zinc-500 line-through ml-2">
                {formatCurrency(product.compareAtPrice)}
              </span>
            )}
          </div>
          <span className="text-[11px] font-mono text-zinc-400">
            {product.stock} in stock
          </span>
        </div>
      </div>
    </motion.div>
  );
}
