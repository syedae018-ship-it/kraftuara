"use client";

import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/layout/admin-layout";
import { SectionTitle } from "@/components/dashboard/section-title";
import { PlanCard } from "@/components/admin/plan-card";
import { Plan } from "@/types/admin";
import { adminRepository } from "@/lib/repositories/admin-repository";
import { Badge } from "@/components/ui/table";
import { Layers } from "lucide-react";

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);

  useEffect(() => {
    async function loadData() {
      const p = await adminRepository.getPlans();
      setPlans(p);
    }
    loadData();
  }, []);

  const handleCreatePlan = async (input: Omit<Plan, "id">) => {
    const created = await adminRepository.createPlan(input);
    setPlans([created, ...plans]);
  };

  return (
    <AdminLayout>
      <SectionTitle
        title="SaaS Subscription Plans & Pricing"
        description="Configure tier pricing, product limits, storage quotas, and feature flags."
        badge={
          <Badge variant="maroon" className="gap-1 font-mono text-[11px]">
            <Layers className="w-3 h-3 text-maroon-300" /> {plans.length} Active Plan Tiers
          </Badge>
        }
      />

      <div className="pb-20">
        <PlanCard plans={plans} onCreatePlan={handleCreatePlan} />
      </div>
    </AdminLayout>
  );
}
