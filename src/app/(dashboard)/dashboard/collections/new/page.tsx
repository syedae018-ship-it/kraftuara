"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { SectionTitle } from "@/components/dashboard/section-title";
import { CollectionForm } from "@/components/collections/collection-form";
import { CreateCollectionInput } from "@/types/collection";
import { Badge } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { PlanGate } from "@/components/dashboard/plan-gate";
// Use the server action — NOT the client-side repository.
// The client repo uses the anon Supabase client which fails the RLS policy on the collections table.
// The server action uses createServerSupabaseClient() which carries the authenticated session.
import { createCollectionAction } from "@/lib/actions/collection";

export default function NewCollectionPage() {
  const router = useRouter();
  const { activeStore } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: CreateCollectionInput) => {
    if (!activeStore?.id) return;
    setIsSubmitting(true);
    try {
      const result = await createCollectionAction(activeStore.id, data);
      if (result.success && result.data) {
        toast.success("Collection Created!", `Added collection "${result.data.name}"`);
        router.push("/dashboard/collections");
      } else {
        toast.error("Error", result.error || "Could not create collection.");
      }
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
          <CollectionForm storeId={activeStore?.id} onSubmit={handleSubmit} isSubmitting={isSubmitting} />
        </div>
      </PlanGate>
    </DashboardLayout>
  );
}
