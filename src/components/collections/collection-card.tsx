"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { MoreVertical, Edit2, Copy, EyeOff, CheckCircle2, Archive, Trash2, Layers, Sparkles } from "lucide-react";
import { Collection } from "@/types/collection";
import { StatusBadge } from "@/components/products/status-badge";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/table";
import { formatRelativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

export interface CollectionCardProps {
  collection: Collection;
  onDuplicate: (id: string) => void;
  onTogglePublish: (id: string) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  className?: string;
}

export function CollectionCard({
  collection,
  onDuplicate,
  onTogglePublish,
  onArchive,
  onDelete,
  className,
}: CollectionCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={cn(
        "group relative bg-[#151515] border border-white/10 rounded-2xl overflow-hidden shadow-card transition-all duration-200 hover:border-white/20 flex flex-col justify-between",
        className
      )}
    >
      {/* Top Media Cover */}
      <div className="relative h-28 w-full bg-[#111111] border-b border-white/5 overflow-hidden flex items-center justify-center">
        {collection.coverImage ? (
          <img
            src={collection.coverImage}
            alt={collection.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-maroon-950/40 border border-maroon-600/40 flex items-center justify-center text-maroon-400">
            <Sparkles className="w-6 h-6" />
          </div>
        )}

        {/* Display Order & Status Badge */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5">
          <Badge variant="outline" className="bg-black/70 backdrop-blur-sm border-white/10 font-mono text-[10px]">
            #{collection.displayOrder}
          </Badge>
          <StatusBadge status={collection.status} />
        </div>

        {/* Action Menu */}
        <div className="absolute top-3 right-3 z-10">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 rounded-lg bg-black/60 border border-white/10 text-zinc-300 hover:text-white transition-colors"
            aria-label="Collection Actions"
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
                    href={`/dashboard/collections/${collection.id}`}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-zinc-400" /> Edit Collection
                  </Link>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onTogglePublish(collection.id);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-white/5 transition-colors text-left"
                  >
                    {collection.status === "published" ? (
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
                      onDuplicate(collection.id);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-white/5 transition-colors text-left"
                  >
                    <Copy className="w-3.5 h-3.5 text-zinc-400" /> Duplicate
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onArchive(collection.id);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-white/5 transition-colors text-left"
                  >
                    <Archive className="w-3.5 h-3.5 text-zinc-400" /> Archive
                  </button>
                  <div className="border-t border-white/10 my-0.5" />
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete(collection.id);
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
      </div>

      {/* Card Body */}
      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
        <div className="space-y-1">
          <Link href={`/dashboard/collections/${collection.id}`}>
            <h3 className="text-sm font-semibold font-heading text-white hover:text-maroon-300 transition-colors line-clamp-1">
              {collection.name}
            </h3>
          </Link>
          <span className="text-[11px] font-mono text-maroon-400 block">/{collection.slug}</span>
          {collection.description && (
            <p className="text-xs text-zinc-400 font-body line-clamp-2 leading-relaxed pt-1">
              {collection.description}
            </p>
          )}
        </div>

        <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs font-body">
          <div className="flex items-center gap-1.5 text-zinc-300 font-medium">
            <Layers className="w-3.5 h-3.5 text-maroon-400" />
            <span>{collection.productCount} Curated Items</span>
          </div>
          <span className="text-[11px] font-mono text-zinc-500">
            {formatRelativeTime(collection.updatedAt)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
