"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { MoreHorizontal, Edit2, Copy, Eye, Archive, Trash2, Package } from "lucide-react";
import { Product } from "@/types/product";
import { StatusBadge } from "./status-badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";

export interface ProductTableProps {
  products: Product[];
  selectedIds: string[];
  onSelectToggle: (id: string) => void;
  onSelectAllToggle: () => void;
  onDuplicate: (id: string) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ProductTable({
  products,
  selectedIds,
  onSelectToggle,
  onSelectAllToggle,
  onDuplicate,
  onArchive,
  onDelete,
}: ProductTableProps) {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const allSelected = products.length > 0 && selectedIds.length === products.length;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={onSelectAllToggle}
              className="rounded bg-[#111111] border-white/20 text-maroon-600 focus:ring-maroon-500 cursor-pointer"
            />
          </TableHead>
          <TableHead className="w-14">Image</TableHead>
          <TableHead>Product</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Price</TableHead>
          <TableHead>Stock</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Views</TableHead>
          <TableHead>Created</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => {
          const isSelected = selectedIds.includes(product.id);
          const coverImage = product.images.find((img) => img.isCover) || product.images[0];
          const isMenuOpen = activeMenuId === product.id;

          return (
            <TableRow key={product.id} className={isSelected ? "bg-maroon-950/20" : ""}>
              <TableCell>
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onSelectToggle(product.id)}
                  className="rounded bg-[#111111] border-white/20 text-maroon-600 focus:ring-maroon-500 cursor-pointer"
                />
              </TableCell>

              {/* Cover Image */}
              <TableCell>
                <div className="w-10 h-10 rounded-lg bg-[#151515] border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                  {coverImage ? (
                    <img src={coverImage.url} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-4 h-4 text-zinc-500" />
                  )}
                </div>
              </TableCell>

              {/* Product Name & SKU */}
              <TableCell>
                <div>
                  <Link
                    href={`/dashboard/products/${product.id}`}
                    className="font-semibold text-white font-heading hover:text-maroon-300 transition-colors line-clamp-1"
                  >
                    {product.name}
                  </Link>
                  <span className="text-[11px] font-mono text-zinc-500">SKU: {product.sku}</span>
                </div>
              </TableCell>

              {/* Category */}
              <TableCell>
                <span className="text-xs font-body text-zinc-300">{product.categoryName}</span>
              </TableCell>

              {/* Price */}
              <TableCell>
                <div className="font-semibold font-mono text-white text-xs">
                  {formatCurrency(product.price)}
                  {product.compareAtPrice && (
                    <span className="text-[11px] font-normal text-zinc-500 line-through ml-1.5">
                      {formatCurrency(product.compareAtPrice)}
                    </span>
                  )}
                </div>
              </TableCell>

              {/* Stock */}
              <TableCell>
                <span className="text-xs font-mono text-zinc-300">{product.stock} units</span>
              </TableCell>

              {/* Status */}
              <TableCell>
                <StatusBadge status={product.status} />
              </TableCell>

              {/* Views */}
              <TableCell>
                <span className="text-xs font-mono text-zinc-400">{product.views.toLocaleString()}</span>
              </TableCell>

              {/* Created Date */}
              <TableCell>
                <span className="text-xs font-mono text-zinc-500">{formatRelativeTime(product.createdAt)}</span>
              </TableCell>

              {/* Actions Dropdown */}
              <TableCell className="text-right relative">
                <button
                  onClick={() => setActiveMenuId(isMenuOpen ? null : product.id)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                  aria-label="Actions"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>

                <AnimatePresence>
                  {isMenuOpen && (
                    <>
                      <div onClick={() => setActiveMenuId(null)} className="fixed inset-0 z-40" />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 5 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 5 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-4 top-10 z-50 w-44 bg-[#151515] border border-white/10 rounded-xl shadow-2xl p-1 font-body text-xs space-y-0.5 text-left backdrop-blur-xl"
                      >
                        <Link
                          href={`/dashboard/products/${product.id}`}
                          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-zinc-400" /> Edit
                        </Link>
                        <button
                          onClick={() => {
                            setActiveMenuId(null);
                            onDuplicate(product.id);
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
                            setActiveMenuId(null);
                            onArchive(product.id);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-white/5 transition-colors text-left"
                        >
                          <Archive className="w-3.5 h-3.5 text-zinc-400" /> Archive
                        </button>
                        <div className="border-t border-white/10 my-0.5" />
                        <button
                          onClick={() => {
                            setActiveMenuId(null);
                            onDelete(product.id);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-red-400 hover:bg-red-950/40 transition-colors text-left"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
