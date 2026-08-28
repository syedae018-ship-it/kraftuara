"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { SectionTitle } from "@/components/dashboard/section-title";
import { CollectionTable } from "@/components/collections/collection-table";
import { CollectionCard } from "@/components/collections/collection-card";
import { ProductGridSkeleton, ProductTableSkeleton } from "@/components/products/product-skeletons";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/table";
import { Collection } from "@/types/collection";
import { collectionRepository } from "@/lib/repositories/collection-repository";
import { Plus, Sparkles, Search, List, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";
import { PlanGate } from "@/components/dashboard/plan-gate";
import { toast } from "@/hooks/use-toast";

export default function CollectionListPage() {
  const { activeStore } = useAuth();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [isLoading, setIsLoading] = useState(true);

  const fetchCollections = async () => {
    if (!activeStore?.id) return;
    setIsLoading(true);
    try {
      const data = await collectionRepository.getAll(activeStore.id);
      setCollections(data);
    } catch (err) {
      toast.error("Error", "Failed to load catalog collections.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, [activeStore]);

  const filteredCollections = useMemo(() => {
    return collections.filter((col) => {
      const matchesSearch =
        !search ||
        col.name.toLowerCase().includes(search.toLowerCase()) ||
        col.slug.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || col.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [collections, search, statusFilter]);

  // Actions
  const handleDuplicate = async (id: string) => {
    if (!activeStore?.id) return;
    const duplicated = await collectionRepository.duplicate(activeStore.id, id);
    if (duplicated) {
      toast.success("Collection Duplicated", `Created copy "${duplicated.name}"`);
      fetchCollections();
    }
  };

  const handleTogglePublish = async (id: string) => {
    const target = collections.find((c) => c.id === id);
    if (!target) return;

    const nextStatus = target.status === "published" ? "draft" : "published";
    await collectionRepository.update(id, { status: nextStatus });
    toast.info("Status Updated", `Changed status to ${nextStatus}.`);
    fetchCollections();
  };

  const handleArchive = async (id: string) => {
    await collectionRepository.update(id, { status: "archived" });
    toast.info("Collection Archived", "Moved collection status to Archived.");
    fetchCollections();
  };

  const handleDelete = async (id: string) => {
    await collectionRepository.delete(id);
    toast.success("Collection Deleted", "Removed collection from catalog.");
    fetchCollections();
  };

  const handleMoveOrder = async (id: string, direction: "up" | "down") => {
    const idx = collections.findIndex((c) => c.id === id);
    if (idx === -1) return;
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= collections.length) return;

    const updated = [...collections];
    const temp = updated[idx];
    updated[idx] = updated[targetIdx];
    updated[targetIdx] = temp;

    setCollections(updated);
    await collectionRepository.reorder(updated.map((c) => c.id));
  };

  return (
    <DashboardLayout breadcrumbs={[{ label: "Store Dashboard", href: "/dashboard" }, { label: "Collections" }]}>
      <PlanGate
        requiredPlan="pro"
        featureName="Product Collections"
        description="Upgrade to the Pro Plan (₹499/mo) to curate targeted collections, seasonal bundles, and special product groups."
      >
        <SectionTitle
          title="Featured Collections"
          description="Curate seasonal themes, promotional bundles, and special product groups."
          badge={
            <Badge variant="maroon" className="gap-1 font-mono text-[11px]">
              <Sparkles className="w-3 h-3 text-maroon-300" /> {collections.length} Collections
            </Badge>
          }
          action={
            <Link href="/dashboard/collections/new">
              <Button variant="primary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
                Create Collection
              </Button>
            </Link>
          }
        />

        <div className="space-y-6 pb-20">
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-4 bg-[#151515] border border-white/10 rounded-2xl shadow-card">
          <div className="flex-1 min-w-[240px]">
            <Input
              placeholder="Search collections by title or handle..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-zinc-500" />}
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 bg-[#111111] border border-white/10 rounded-xl px-3 text-xs text-white font-body outline-none hover:border-white/20 focus:border-maroon-700 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>

            <div className="flex items-center bg-[#111111] border border-white/10 rounded-xl p-1 shrink-0">
              <button
                onClick={() => setViewMode("table")}
                className={cn(
                  "p-1.5 rounded-lg transition-colors",
                  viewMode === "table" ? "bg-maroon-800 text-white shadow-sm" : "text-zinc-400 hover:text-white"
                )}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-1.5 rounded-lg transition-colors",
                  viewMode === "grid" ? "bg-maroon-800 text-white shadow-sm" : "text-zinc-400 hover:text-white"
                )}
                title="Grid Card View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Content Body */}
        {isLoading ? (
          viewMode === "table" ? <ProductTableSkeleton rows={4} /> : <ProductGridSkeleton count={4} />
        ) : filteredCollections.length === 0 ? (
          <EmptyState
            icon={<Sparkles className="w-8 h-8 text-maroon-400" />}
            title="Curate products your customers will love"
            description="Create targeted product collections like Best Sellers, New Arrivals, or Eid Special Gift Sets."
            action={
              <Link href="/dashboard/collections/new">
                <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
                  Create First Collection
                </Button>
              </Link>
            }
          />
        ) : viewMode === "table" ? (
          <CollectionTable
            collections={filteredCollections}
            onDuplicate={handleDuplicate}
            onTogglePublish={handleTogglePublish}
            onArchive={handleArchive}
            onDelete={handleDelete}
            onMoveUp={(id) => handleMoveOrder(id, "up")}
            onMoveDown={(id) => handleMoveOrder(id, "down")}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCollections.map((col) => (
              <CollectionCard
                key={col.id}
                collection={col}
                onDuplicate={handleDuplicate}
                onTogglePublish={handleTogglePublish}
                onArchive={handleArchive}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
        </div>
      </PlanGate>
    </DashboardLayout>
  );
}
