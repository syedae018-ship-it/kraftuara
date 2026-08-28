"use client";

import React, { useState } from "react";
import { Plus, Check, ChevronDown, FolderPlus } from "lucide-react";
import { CategoryOption } from "@/types/product";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

import { categoryRepository } from "@/lib/repositories/category-repository";
import { useAuth } from "@/context/auth-context";

export interface CategoryDropdownProps {
  categories: CategoryOption[];
  selectedCategoryId: string;
  onSelectCategory: (category: CategoryOption) => void;
  onAddCategory: (newCat: CategoryOption) => void;
  error?: string;
  className?: string;
}

export function CategoryDropdown({
  categories,
  selectedCategoryId,
  onSelectCategory,
  onAddCategory,
  error,
  className,
}: CategoryDropdownProps) {
  const { activeStore } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId) || categories[0];

  const handleCreateCategory = async () => {
    const trimmed = newCatName.trim();
    if (!trimmed) {
      toast.error("Name Required", "Please enter a category name.");
      return;
    }

    if (!activeStore?.id) {
      toast.error("Error", "No active store found.");
      return;
    }

    setIsCreating(true);
    try {
      const dbCat = await categoryRepository.create(activeStore.id, {
        name: trimmed,
        slug: trimmed.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        status: "published",
        displayOrder: 0,
      });

      const created: CategoryOption = {
        id: dbCat.id,
        name: dbCat.name,
        slug: dbCat.slug,
        itemCount: 0,
      };

      onAddCategory(created);
      onSelectCategory(created);
      setNewCatName("");
      setModalOpen(false);
      toast.success("Category Created", `Added category "${created.name}"`);
    } catch (err: any) {
      toast.error("Category Error", err.message || "Failed to create category. Please check your plan limits.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="text-xs font-semibold text-zinc-300 font-heading tracking-wide">
        Product Category
      </label>

      <div className="relative">
        <button
          type="button"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className={cn(
            "w-full h-10 bg-[#111111] border border-white/10 rounded-xl px-3.5 flex items-center justify-between text-sm text-white font-body outline-none hover:border-white/20 transition-all",
            error && "border-red-500"
          )}
        >
          <span className="font-medium text-white">{selectedCategory?.name || "Select Category"}</span>
          <ChevronDown className="w-4 h-4 text-zinc-500" />
        </button>

        {dropdownOpen && (
          <>
            <div onClick={() => setDropdownOpen(false)} className="fixed inset-0 z-40" />

            <div className="absolute left-0 right-0 top-11 z-50 bg-[#151515] border border-white/10 rounded-xl shadow-2xl p-1.5 backdrop-blur-xl space-y-1 max-h-56 overflow-y-auto font-body text-xs">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    onSelectCategory(cat);
                    setDropdownOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-zinc-300 hover:text-white hover:bg-white/5 transition-colors text-left"
                >
                  <span>{cat.name}</span>
                  {selectedCategoryId === cat.id && <Check className="w-3.5 h-3.5 text-maroon-400" />}
                </button>
              ))}

              <div className="border-t border-white/10 pt-1 mt-1">
                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    setModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-maroon-400 hover:bg-maroon-950/40 transition-colors font-medium text-left"
                >
                  <Plus className="w-3.5 h-3.5" /> Quick Create Category
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      {error && <p className="text-xs text-red-400 font-body">{error}</p>}

      {/* Quick Create Category Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create Product Category"
        description="Add a new category to organize your catalog products."
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)} disabled={isCreating}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateCategory} isLoading={isCreating}>
              Create Category
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Category Name"
            placeholder="e.g. Concentrated Oils, Oud Sticks"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            leftIcon={<FolderPlus className="w-4 h-4 text-zinc-500" />}
            autoFocus
          />
        </div>
      </Modal>
    </div>
  );
}
