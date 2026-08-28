"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { SectionTitle } from "@/components/dashboard/section-title";
import { CollectionForm } from "@/components/collections/collection-form";
import { Collection, CreateCollectionInput } from "@/types/collection";
import { collectionRepository } from "@/lib/repositories/collection-repository";
// Use server actions for all mutations — client repo uses anon client which fails RLS.
import { updateCollectionAction, deleteCollectionAction } from "@/lib/actions/collection";
import { Badge } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit2, ArrowLeft, Trash2, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { PlanGate } from "@/components/dashboard/plan-gate";
import { useAuth } from "@/context/auth-context";

export default function EditCollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { activeStore } = useAuth();

  const [collection, setCollection] = useState<Collection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      // Read is fine with client repo (public read or RLS-allowed)
      const data = await collectionRepository.getById(id);
      if (!data) {
        toast.error("Not Found", "Collection could not be found.");
        router.push("/dashboard/collections");
        return;
      }
      setCollection(data);
      setIsLoading(false);
    }
    loadData();
  }, [id, router]);

  const handleSubmit = async (data: CreateCollectionInput) => {
    if (!activeStore?.id) return;
    setIsSubmitting(true);
    try {
      const result = await updateCollectionAction(activeStore.id, id, data);
      if (result.success) {
        toast.success("Collection Updated!", `Saved changes for "${data.name}"`);
        router.push("/dashboard/collections");
      } else {
        toast.error("Error", result.error || "Could not update collection.");
      }
    } catch (err) {
      toast.error("Error", "Could not update collection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCollection = async () => {
    if (!activeStore?.id) return;
    try {
      const result = await deleteCollectionAction(activeStore.id, id);
      if (result.success) {
        toast.success("Collection Deleted", "Collection removed successfully.");
        router.push("/dashboard/collections");
      } else {
        toast.error("Error", result.error || "Could not delete collection.");
      }
    } catch (err) {
      toast.error("Error", "Could not delete collection.");
    }
  };

  if (isLoading || !collection) {
    return (
      <DashboardLayout breadcrumbs={[{ label: "Collections", href: "/dashboard/collections" }, { label: "Edit Collection" }]}>
        <div className="flex items-center justify-center p-12 text-zinc-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-maroon-400" /> Loading collection details...
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout breadcrumbs={[{ label: "Collections", href: "/dashboard/collections" }, { label: collection.name }]}>
      <PlanGate
        requiredPlan="pro"
        featureName="Product Collections"
        description="Upgrade to the Pro Plan (₹499/mo) to curate targeted collections, seasonal bundles, and special product groups."
      >
        <SectionTitle
          title={`Edit: ${collection.name}`}
          description="Update collection details, curated products list, cover image, and SEO meta tags."
          badge={
            <Badge variant="maroon" className="gap-1 font-mono text-[11px]">
              <Edit2 className="w-3 h-3 text-maroon-300" /> Order #{collection.displayOrder}
            </Badge>
          }
          action={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/dashboard/collections")}
                leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
              >
                Back
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDeleteCollection}
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              >
                Delete
              </Button>
            </div>
          }
        />

        <div className="max-w-3xl pb-20">
          <CollectionForm initialValues={collection} onSubmit={handleSubmit} isSubmitting={isSubmitting} />
        </div>
      </PlanGate>
    </DashboardLayout>
  );
}
