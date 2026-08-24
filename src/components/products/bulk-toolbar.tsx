"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, EyeOff, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface BulkToolbarProps {
  selectedCount: number;
  onBulkPublish: () => void;
  onBulkUnpublish: () => void;
  onBulkDelete: () => void;
  onClearSelection: () => void;
}

export function BulkToolbar({
  selectedCount,
  onBulkPublish,
  onBulkUnpublish,
  onBulkDelete,
  onClearSelection,
}: BulkToolbarProps) {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#151515] border border-maroon-600/40 shadow-glow rounded-2xl px-4 py-2.5 flex items-center gap-3 sm:gap-4 backdrop-blur-xl max-w-xl w-full mx-auto"
        >
          <div className="flex items-center gap-2 pr-3 border-r border-white/10 shrink-0">
            <span className="w-5 h-5 rounded-full bg-maroon-800 text-white font-mono text-[11px] font-bold flex items-center justify-center">
              {selectedCount}
            </span>
            <span className="text-xs font-semibold font-heading text-white hidden sm:inline">
              Selected
            </span>
          </div>

          <div className="flex items-center gap-2 flex-1 justify-center sm:justify-start">
            <Button
              variant="outline"
              size="sm"
              onClick={onBulkPublish}
              leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
            >
              Publish
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onBulkUnpublish}
              leftIcon={<EyeOff className="w-3.5 h-3.5 text-zinc-400" />}
            >
              Unpublish
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={onBulkDelete}
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            >
              Delete
            </Button>
          </div>

          <button
            onClick={onClearSelection}
            className="p-1 rounded-lg text-zinc-400 hover:text-white transition-colors"
            title="Cancel selection"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
