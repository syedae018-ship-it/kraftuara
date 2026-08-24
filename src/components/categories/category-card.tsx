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
  ArrowUp,
  ArrowDown,
  Folder,
  Layers,
  CheckCircle2,
  EyeOff,
} from "lucide-react";
import { Category } from "@/types/category";
import { StatusBadge } from "@/components/products/status-badge";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/table";
import { formatRelativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

export interface CategoryCardProps {
  category: Category;
  onDuplicate: (id: string) => void;
  onTogglePublish: (id: string) => void;
  onArchive: (id: string) => void;
  onDeleteRequest: (category: Category) => void;
  onMoveUp?: (id: string) => void;
  onMoveDown?: (id: string) => void;
  className?: string;
}

export function CategoryCard({
  category,
  onDuplicate,
  onTogglePublish,
  onArchive,
  onDeleteRequest,
  onMoveUp,
  onMoveDown,
  className,
}: CategoryCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={cn(
        "group relative bg-[#151515] border border-white/10 rounded-2xl overflow-hidden shadow-card transition-all duration-200 hover:border-white/20 flex flex-col justify-between",
        className
      )}
    >
      {/* Top Media Cover / Header Header */}
      <div className="relative h-28 w-full bg-[#111111] border-b border-white/5 overflow-hidden flex items-center justify-center">
        {category.coverImage ? (
          <img
            src={category.coverImage}
            alt={category.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-500">
            <Folder className="w-6 h-6 text-maroon-400" />
          </div>
        )}

        {/* Display Order Badge Top-Left */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5">
          <Badge variant="outline" className="bg-black/70 backdrop-blur-sm border-white/10 font-mono text-[10px]">
            #{category.displayOrder}
          </Badge>
          <StatusBadge status={category.status} />
        </div>

        {/* Action Menu Top-Right */}
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1">
          {onMoveUp && (
            <button
              onClick={() => onMoveUp(category.id)}
              className="p-1 rounded-lg bg-black/60 border border-white/10 text-zinc-400 hover:text-white transition-colors"
              title="Move Up"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          )}
          {onMoveDown && (
            <button
              onClick={() => onMoveDown(category.id)}
              className="p-1 rounded-lg bg-black/60 border border-white/10 text-zinc-400 hover:text-white transition-colors"
              title="Move Down"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 rounded-lg bg-black/60 border border-white/10 text-zinc-300 hover:text-white transition-colors"
            aria-label="Category actions"
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
                  className="absolute right-0 top-8 z-50 w-44 bg-[#151515] border border-white/10 rounded-xl shadow-2xl p-1 font-body text-xs space-y-0.5 backdrop-blur-xl text-left"
                >
                  <Link
                    href={`/dashboard/categories/${category.id}`}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-zinc-400" /> Edit Category
                  </Link>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
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
                      setMenuOpen(false);
                      onDuplicate(category.id);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-white/5 transition-colors text-left"
                  >
                    <Copy className="w-3.5 h-3.5 text-zinc-400" /> Duplicate
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onArchive(category.id);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-white/5 transition-colors text-left"
                  >
                    <Archive className="w-3.5 h-3.5 text-zinc-400" /> Archive
                  </button>
                  <div className="border-t border-white/10 my-0.5" />
                  <button
                    onClick={() => {
                      setMenuOpen(false);
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
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
        <div className="space-y-1">
          <Link href={`/dashboard/categories/${category.id}`}>
            <h3 className="text-sm font-semibold font-heading text-white hover:text-maroon-300 transition-colors line-clamp-1">
              {category.name}
            </h3>
          </Link>
          <span className="text-[11px] font-mono text-maroon-400 block">/{category.slug}</span>
          {category.description && (
            <p className="text-xs text-zinc-400 font-body line-clamp-2 leading-relaxed pt-1">
              {category.description}
            </p>
          )}
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs font-body">
          <div className="flex items-center gap-1.5 text-zinc-300 font-medium">
            <Layers className="w-3.5 h-3.5 text-maroon-400" />
            <span>{category.productCount} Products</span>
          </div>
          <span className="text-[11px] font-mono text-zinc-500">
            {formatRelativeTime(category.updatedAt)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
