"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { SectionTitle } from "@/components/dashboard/section-title";
import { CollectionForm } from "@/components/collections/collection-form";
import { CreateCollectionInput } from "@/types/collection";
import { collectionRepository } from "@/lib/repositories/collection-repository";
import { Badge } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";

import { useAuth } from "@/context/auth-context";
import { PlanGate } from "@/components/dashboard/plan-gate";

export default function NewCollectionPage() {
  const router = useRouter();
  const { activeStore } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: CreateCollectionInput) => {
    if (!activeStore?.id) return;
    setIsSubmitting(true);
    try {
      const created = await collectionRepository.create(activeStore.id, data);
      toast.success("Collection Created!", `Added collection "${created.name}"`);
      router.push("/dashboard/collections");
    } catch (err) {
      toast.error("Error", "Could not create collection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout breadcrumbs={[{ label: "Collections", href: "/dashboard/collections" }, { label: "New Collection" }]}>
      <PlanGate
        requiredPlan="pro"
        featureName="Product Collections"
        description="Upgrade to the Pro Plan (₹499/mo) to curate targeted collections, seasonal bundles, and special product groups."
      >
        <SectionTitle
          title="Create New Collection"
          description="Curate a group of catalog products with custom cover image and SEO meta tags."
          badge={
            <Badge variant="maroon" className="gap-1 font-mono text-[11px]">
              <Plus className="w-3 h-3 text-maroon-300" /> New Collection
            </Badge>
          }
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/dashboard/collections")}
              leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
            >
              Back to Collections
            </Button>
          }
        />

        <div className="max-w-3xl pb-20">
          <CollectionForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
        </div>
      </PlanGate>
    </DashboardLayout>
  );
}
