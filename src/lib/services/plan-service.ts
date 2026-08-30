/**
 * Central SaaS Plan Service
 * Single Source of Truth for SaaS Plan Management, Dynamic Pricing & Auditing
 */

import { createAdminClient } from "@/lib/supabase/admin";
import {
  PLANS,
  PlanConfig,
  PlanTier,
  BillingInterval,
  normalizePlanTier,
  setDynamicPlansRegistry,
} from "@/lib/feature-gating";

function getSupabaseAdminSafe() {
  try {
    return createAdminClient();
  } catch (err) {
    return null;
  }
}

/**
 * Maps database row to standard PlanConfig.
 */
function mapRowToPlanConfig(row: any): PlanConfig {
  const tier = normalizePlanTier(row.id);
  const fallback = PLANS[tier] || PLANS.startup;

  return {
    id: tier,
    name: row.name || fallback.name,
    priceMonthly: Number(row.price_monthly ?? fallback.priceMonthly),
    priceAnnual: Number(row.price_annual ?? fallback.priceAnnual),
    description: row.description || fallback.description,
    productLimit: Number(row.product_limit ?? fallback.productLimit),
    categoryLimit: Number(row.category_limit ?? fallback.categoryLimit),
    allowedFeatures: Array.isArray(row.allowed_features) ? row.allowed_features : fallback.allowedFeatures,
    featuresDisplay: Array.isArray(row.features_display) ? row.features_display : fallback.featuresDisplay,
    hierarchyWeight: fallback.hierarchyWeight,
    displayOrder: Number(row.display_order ?? fallback.displayOrder ?? 1),
    popular: Boolean(row.is_popular ?? fallback.popular),
    badge: row.badge || fallback.badge,
    status: (row.status as "active" | "inactive" | "archived") || "active",
    isTrialEligible: Boolean(row.is_trial_eligible ?? fallback.isTrialEligible),
    trialDays: Number(row.trial_days ?? fallback.trialDays ?? 3),
    updatedAt: row.updated_at,
  };
}

/**
 * Retrieves all configured plans from database with caching and fallback.
 */
export async function getAllPlans(includeInactive = false): Promise<PlanConfig[]> {
  const supabase = getSupabaseAdminSafe();

  if (supabase) {
    try {
      let query = (supabase as any)
        .from("saas_plans")
        .select("*")
        .order("display_order", { ascending: true });

      if (!includeInactive) {
        query = query.eq("status", "active");
      }

      const { data, error } = await query;

      if (!error && data && data.length > 0) {
        const mapped = data.map(mapRowToPlanConfig);

        // Update the dynamic in-memory registry
        const registryUpdate: Record<PlanTier, PlanConfig> = {} as any;
        for (const p of mapped) {
          registryUpdate[p.id as PlanTier] = p;
        }
        setDynamicPlansRegistry(registryUpdate);

        return mapped;
      }
    } catch (err) {
      console.warn("Could not query saas_plans table, falling back to static config:", err);
    }
  }

  // Fallback to in-memory dynamic plans registry
  const { getDynamicPlansRegistry } = await import("@/lib/feature-gating");
  const fallbackList = Object.values(getDynamicPlansRegistry())
    .filter((p) => includeInactive || p.status !== "inactive")
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  return fallbackList;
}

/**
 * Retrieves a single authoritative plan by tier/ID.
 */
export async function getAuthoritativePlan(planName?: string | null): Promise<PlanConfig> {
  const tier = normalizePlanTier(planName);
  const all = await getAllPlans(true);
  const found = all.find((p) => p.id === tier);
  return found || PLANS[tier] || PLANS.startup;
}

/**
 * Returns exact price in INR for a plan and billing interval.
 */
export async function getPlanPrice(
  planName: string | null | undefined,
  interval: BillingInterval = "monthly"
): Promise<number> {
  const plan = await getAuthoritativePlan(planName);
  return interval === "annual" ? plan.priceAnnual : plan.priceMonthly;
}

/**
 * Updates a plan configuration and logs to the audit table.
 */
export async function updatePlan(params: {
  planId: PlanTier;
  updates: Partial<PlanConfig>;
  adminEmail: string;
}): Promise<{ success: boolean; data?: PlanConfig; error?: string }> {
  const supabase = getSupabaseAdminSafe();
  const tier = normalizePlanTier(params.planId);
  const existing = await getAuthoritativePlan(tier);

  const payload: any = {
    updated_at: new Date().toISOString(),
  };

  if (params.updates.name !== undefined) payload.name = params.updates.name.trim();
  if (params.updates.priceMonthly !== undefined) payload.price_monthly = Number(params.updates.priceMonthly);
  if (params.updates.priceAnnual !== undefined) payload.price_annual = Number(params.updates.priceAnnual);
  if (params.updates.description !== undefined) payload.description = params.updates.description.trim();
  if (params.updates.productLimit !== undefined) payload.product_limit = Number(params.updates.productLimit);
  if (params.updates.categoryLimit !== undefined) payload.category_limit = Number(params.updates.categoryLimit);
  if (params.updates.allowedFeatures !== undefined) payload.allowed_features = params.updates.allowedFeatures;
  if (params.updates.featuresDisplay !== undefined) payload.features_display = params.updates.featuresDisplay;
  if (params.updates.displayOrder !== undefined) payload.display_order = Number(params.updates.displayOrder);
  if (params.updates.popular !== undefined) payload.is_popular = Boolean(params.updates.popular);
  if (params.updates.badge !== undefined) payload.badge = params.updates.badge ? params.updates.badge.trim() : null;
  if (params.updates.status !== undefined) payload.status = params.updates.status;
  if (params.updates.isTrialEligible !== undefined) payload.is_trial_eligible = Boolean(params.updates.isTrialEligible);
  if (params.updates.trialDays !== undefined) payload.trial_days = Number(params.updates.trialDays);

  if (supabase) {
    try {
      const { error: upsertError } = await (supabase as any)
        .from("saas_plans")
        .upsert({
          id: tier,
          ...payload,
        });

      if (upsertError) {
        return { success: false, error: upsertError.message };
      }

      // Record Audit Log
      await (supabase as any).from("plan_audit_logs").insert({
        plan_id: tier,
        admin_email: params.adminEmail,
        action: "update_plan",
        old_values: existing,
        new_values: { ...existing, ...payload },
      });
    } catch (err: any) {
      console.warn("Database plan write error:", err);
    }
  }

  // Update in-memory registry immediately
  const updatedConfig: PlanConfig = {
    ...existing,
    ...params.updates,
    id: tier,
  };

  setDynamicPlansRegistry({ [tier]: updatedConfig } as any);

  return { success: true, data: updatedConfig };
}

/**
 * Retrieves audit history logs for SaaS plans.
 */
export async function getPlanAuditLogs(limit = 50): Promise<any[]> {
  const supabase = getSupabaseAdminSafe();
  if (!supabase) return [];

  try {
    const { data, error } = await (supabase as any)
      .from("plan_audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (!error && data) {
      return data;
    }
  } catch (err) {
    console.warn("Could not fetch plan audit logs:", err);
  }

  return [];
}
