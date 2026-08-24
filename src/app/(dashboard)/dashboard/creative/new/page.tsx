"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { SectionTitle } from "@/components/dashboard/section-title";
import { CreativeOrderForm } from "@/components/creative/creative-order-form";
import { CreativeService, CreateCreativeOrderInput } from "@/types/creative";
import { creativeRepository } from "@/lib/repositories/creative-repository";
import { Badge } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

function CreativeOrderFormWrapper() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const serviceIdParam = searchParams.get("serviceId");

  const [services, setServices] = useState<CreativeService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const data = await creativeRepository.getServices();
      setServices(data);
      setIsLoading(false);
    }
    loadData();
  }, []);

  const handleSubmit = async (input: CreateCreativeOrderInput) => {
    setIsSubmitting(true);
    try {
      const created = await creativeRepository.createOrder(input);
      toast.success("Creative Brief Submitted!", `Order #${created.orderNumber} is under review.`);
      router.push(`/dashboard/creative/orders/${created.id}`);
    } catch (err) {
      toast.error("Error", "Could not submit creative order.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12 text-zinc-400 gap-2 font-body">
        <Loader2 className="w-5 h-5 animate-spin text-maroon-400" /> Loading service catalog...
      </div>
    );
  }

  return (
    <CreativeOrderForm
      services={services}
      preselectedServiceId={serviceIdParam || undefined}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    />
  );
}

export default function NewCreativeOrderPage() {
  const router = useRouter();

  return (
    <DashboardLayout breadcrumbs={[{ label: "Creative Hub", href: "/dashboard/creative" }, { label: "New Order Brief" }]}>
      <SectionTitle
        title="Submit Creative Brief"
        description="Fill project specifications, upload references, and request custom graphics or AI renders."
        badge={
          <Badge variant="maroon" className="gap-1 font-mono text-[11px]">
            <Sparkles className="w-3 h-3 text-maroon-300" /> New Order
          </Badge>
        }
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/dashboard/creative")}
            leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
          >
            Back to Creative Hub
          </Button>
        }
      />

      <div className="max-w-3xl pb-20">
        <Suspense fallback={<div className="flex items-center justify-center p-12 text-zinc-400 gap-2"><Loader2 className="w-5 h-5 animate-spin text-maroon-400" /> Loading...</div>}>
          <CreativeOrderFormWrapper />
        </Suspense>
      </div>
    </DashboardLayout>
  );
}
