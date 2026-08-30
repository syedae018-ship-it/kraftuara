"use client";

import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/layout/admin-layout";
import { SectionTitle } from "@/components/dashboard/section-title";
import { PlanCard } from "@/components/admin/plan-card";
import { PlanConfig, PlanTier } from "@/lib/feature-gating";
import {
  getAdminPlansAction,
  updateAdminPlanAction,
  toggleAdminPlanStatusAction,
  getAdminPlanAuditLogsAction,
} from "@/lib/actions/admin-plans";
import { Badge } from "@/components/ui/table";
import { Layers, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<PlanConfig[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadPlansAndAudit = async () => {
    setIsLoading(true);
    try {
      const [plansRes, logsRes] = await Promise.all([
        getAdminPlansAction(),
        getAdminPlanAuditLogsAction(),
      ]);

      if (plansRes.success && plansRes.data) {
        setPlans(plansRes.data);
      } else if (!plansRes.success) {
        toast.error("Error", plansRes.error || "Failed to load SaaS plans.");
      }

      if (logsRes.success && logsRes.data) {
        setAuditLogs(logsRes.data);
      }
    } catch (err: any) {
      toast.error("Error", err.message || "Failed to load plan settings.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPlansAndAudit();
  }, []);

  const handleUpdatePlan = async (planId: PlanTier, updates: Partial<PlanConfig>): Promise<boolean> => {
    try {
      const res = await updateAdminPlanAction(planId, updates);
      if (res.success && res.data) {
        setPlans(plans.map((p) => (p.id === planId ? res.data! : p)));
        await loadPlansAndAudit();
        return true;
      } else if (!res.success) {
        toast.error("Update Failed", res.error || "Could not save plan changes.");
        return false;
      }
      return false;
    } catch (err: any) {
      toast.error("Error", err.message || "Plan update failed.");
      return false;
    }
  };

  const handleToggleStatus = async (planId: PlanTier, status: "active" | "inactive"): Promise<boolean> => {
    try {
      const res = await toggleAdminPlanStatusAction(planId, status);
      if (res.success) {
        setPlans(plans.map((p) => (p.id === planId ? { ...p, status } : p)));
        toast.success("Status Updated", `Plan ${planId} marked as ${status}.`);
        await loadPlansAndAudit();
        return true;
      } else {
        toast.error("Toggle Failed", res.error || "Could not toggle status.");
        return false;
      }
    } catch (err: any) {
      toast.error("Error", err.message || "Failed to toggle status.");
      return false;
    }
  };

  return (
    <AdminLayout>
      <SectionTitle
        title="SaaS Subscription Plans & Pricing"
        description="Centralized control center for tier pricing, product limits, feature entitlements, and marketing display."
        badge={
          <Badge variant="maroon" className="gap-1 font-mono text-[11px]">
            <Layers className="w-3 h-3 text-maroon-300" /> {plans.length} Configured Tiers
          </Badge>
        }
      />

      <div className="pb-20">
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <Loader2 className="w-8 h-8 animate-spin text-maroon-500" />
          </div>
        ) : (
          <PlanCard
            plans={plans}
            onUpdatePlan={handleUpdatePlan}
            onToggleStatus={handleToggleStatus}
            auditLogs={auditLogs}
          />
        )}
      </div>
    </AdminLayout>
  );
}
