"use client";

import React from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Category } from "@/types/category";

export interface DeleteCategoryModalProps {
  category: Category | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: (id: string) => void;
  isDeleting?: boolean;
}

export function DeleteCategoryModal({
  category,
  isOpen,
  onClose,
  onConfirmDelete,
  isDeleting = false,
}: DeleteCategoryModalProps) {
  if (!category) return null;

  const hasProducts = category.productCount > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Delete "${category.name}"?`}
      maxWidth="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => onConfirmDelete(category.id)}
            isLoading={isDeleting}
            leftIcon={<Trash2 className="w-4 h-4" />}
          >
            Confirm Delete
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {hasProducts ? (
          <div className="bg-amber-950/30 border border-amber-800/40 rounded-xl p-4 flex items-start gap-3 text-amber-300">
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
            <div className="text-xs font-body leading-relaxed space-y-1">
              <span className="font-semibold block text-amber-200">
                This category currently contains {category.productCount} product(s).
              </span>
              <p>
                Deleting this category will <strong className="text-white">NOT delete your products</strong>. The products will simply become uncategorized until reassigned.
              </p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-zinc-300 font-body leading-relaxed">
            Are you sure you want to delete <strong className="text-white">&quot;{category.name}&quot;</strong>? This action cannot be undone.
          </p>
        )}
      </div>
    </Modal>
  );
}
