"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { MoreHorizontal, Edit2, Copy, EyeOff, CheckCircle2, Archive, Trash2, Folder, ArrowUp, ArrowDown } from "lucide-react";
import { Category } from "@/types/category";
import { StatusBadge } from "@/components/products/status-badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatRelativeTime } from "@/lib/utils";

export interface CategoryTableProps {
  categories: Category[];
  onDuplicate: (id: string) => void;
  onTogglePublish: (id: string) => void;
  onArchive: (id: string) => void;
  onDeleteRequest: (category: Category) => void;
  onMoveUp?: (id: string) => void;
  onMoveDown?: (id: string) => void;
}

export function CategoryTable({
  categories,
  onDuplicate,
  onTogglePublish,
  onArchive,
  onDeleteRequest,
  onMoveUp,
  onMoveDown,
}: CategoryTableProps) {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">Order</TableHead>
          <TableHead className="w-14">Image</TableHead>
          <TableHead>Category</TableHead>
          <TableHead className="hidden md:table-cell">Description</TableHead>
          <TableHead>Products</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="hidden sm:table-cell">Updated</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {categories.map((category, idx) => {
          const isMenuOpen = activeMenuId === category.id;

          return (
            <TableRow key={category.id}>
              {/* Order & Sort Buttons */}
              <TableCell>
                <div className="flex items-center gap-1">
                  <span className="font-mono text-xs font-bold text-zinc-400">#{category.displayOrder}</span>
                  <div className="flex flex-col gap-0.5">
                    {onMoveUp && idx > 0 && (
                      <button
                        onClick={() => onMoveUp(category.id)}
                        className="text-zinc-500 hover:text-white"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                    )}
                    {onMoveDown && idx < categories.length - 1 && (
                      <button
                        onClick={() => onMoveDown(category.id)}
                        className="text-zinc-500 hover:text-white"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </TableCell>

              {/* Cover Image */}
              <TableCell>
                <div className="w-10 h-10 rounded-lg bg-[#151515] border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                  {category.coverImage ? (
                    <img src={category.coverImage} alt={category.name} className="w-full h-full object-cover" />
                  ) : (
                    <Folder className="w-4 h-4 text-maroon-400" />
                  )}
                </div>
              </TableCell>

              {/* Name & Slug */}
              <TableCell>
                <div>
                  <Link
                    href={`/dashboard/categories/${category.id}`}
                    className="font-semibold text-white font-heading hover:text-maroon-300 transition-colors line-clamp-1"
                  >
                    {category.name}
                  </Link>
                  <span className="text-[11px] font-mono text-maroon-400">/{category.slug}</span>
                </div>
              </TableCell>

              {/* Description */}
              <TableCell className="hidden md:table-cell max-w-xs truncate">
                <span className="text-xs text-zinc-400 font-body">{category.description || "—"}</span>
              </TableCell>

              {/* Products Count */}
              <TableCell>
                <span className="text-xs font-mono font-semibold text-white">{category.productCount} items</span>
              </TableCell>

              {/* Status */}
              <TableCell>
                <StatusBadge status={category.status} />
              </TableCell>

              {/* Updated */}
              <TableCell className="hidden sm:table-cell">
                <span className="text-xs font-mono text-zinc-500">{formatRelativeTime(category.updatedAt)}</span>
              </TableCell>

              {/* Actions Dropdown */}
              <TableCell className="text-right relative">
                <button
                  onClick={() => setActiveMenuId(isMenuOpen ? null : category.id)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                  aria-label="Category Actions"
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
                          href={`/dashboard/categories/${category.id}`}
                          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-zinc-400" /> Edit Category
                        </Link>
                        <button
                          onClick={() => {
                            setActiveMenuId(null);
                            onTogglePublish(category.id);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-white/5 transition-colors text-left"
                        >
                          {category.status === "published" ? (
                            <>
                              <EyeOff className="w-3.5 h-3.5 text-zinc-400" /> Unpublish
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Publish
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setActiveMenuId(null);
                            onDuplicate(category.id);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-white/5 transition-colors text-left"
                        >
                          <Copy className="w-3.5 h-3.5 text-zinc-400" /> Duplicate
                        </button>
                        <button
                          onClick={() => {
                            setActiveMenuId(null);
                            onArchive(category.id);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-white/5 transition-colors text-left"
                        >
                          <Archive className="w-3.5 h-3.5 text-zinc-400" /> Archive
                        </button>
                        <div className="border-t border-white/10 my-0.5" />
                        <button
                          onClick={() => {
                            setActiveMenuId(null);
                            onDeleteRequest(category);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-red-400 hover:bg-red-950/40 transition-colors text-left"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete Category
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
