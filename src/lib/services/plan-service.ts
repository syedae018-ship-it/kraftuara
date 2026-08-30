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
  getDynamicPlansRegistry,
} from "@/lib/feature-gating";

function getSupabaseAdminSafe() {
  try {
    return createAdminClient();
  } catch (err) {
    return null;
  }
}

/**
 * Maps database row / JSON payload to standard PlanConfig.
 */
function mapRowToPlanConfig(row: any): PlanConfig {
  const tier = normalizePlanTier(row.id || row.plan_id);
  const fallback = PLANS[tier] || PLANS.startup;

  return {
    id: tier,
    name: row.name || fallback.name,
    priceMonthly: Number(row.price_monthly ?? row.priceMonthly ?? fallback.priceMonthly),
    priceAnnual: Number(row.price_annual ?? row.priceAnnual ?? fallback.priceAnnual),
    description: row.description || fallback.description,
    productLimit: Number(row.product_limit ?? row.productLimit ?? fallback.productLimit),
    categoryLimit: Number(row.category_limit ?? row.categoryLimit ?? fallback.categoryLimit),
    allowedFeatures: Array.isArray(row.allowed_features || row.allowedFeatures)
      ? (row.allowed_features || row.allowedFeatures)
      : fallback.allowedFeatures,
    featuresDisplay: Array.isArray(row.features_display || row.featuresDisplay)
      ? (row.features_display || row.featuresDisplay)
      : fallback.featuresDisplay,
    hierarchyWeight: fallback.hierarchyWeight,
    displayOrder: Number(row.display_order ?? row.displayOrder ?? fallback.displayOrder ?? 1),
    popular: Boolean(row.is_popular ?? row.popular ?? fallback.popular),
    badge: row.badge || fallback.badge,
    status: (row.status as "active" | "inactive" | "archived") || "active",
    isTrialEligible: Boolean(row.is_trial_eligible ?? row.isTrialEligible ?? fallback.isTrialEligible),
    trialDays: Number(row.trial_days ?? row.trialDays ?? fallback.trialDays ?? 3),
    updatedAt: row.updated_at || row.updatedAt || new Date().toISOString(),
  };
}

/**
 * Retrieves all configured plans from database with caching and fallback.
 */
export async function getAllPlans(includeInactive = false): Promise<PlanConfig[]> {
  const supabase = getSupabaseAdminSafe();

  if (supabase) {
    // 1. Attempt primary saas_plans table
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
      // Fall through to activity_logs persistent store
    }

    // 2. Query persistent activity_logs store for custom plan configs
    try {
      const { data: logsData, error: logsError } = await (supabase as any)
        .from("activity_logs")
        .select("*")
        .like("action", "saas_plan_config_%")
        .order("created_at", { ascending: false });

      if (!logsError && logsData && logsData.length > 0) {
        // Group by tier and take most recent config
        const latestByTier: Record<string, PlanConfig> = {};
        for (const log of logsData) {
          const tier = log.action.replace("saas_plan_config_", "") as PlanTier;
          if (!latestByTier[tier] && log.details) {
            latestByTier[tier] = mapRowToPlanConfig({ ...log.details, id: tier });
          }
        }

        // Merge with defaults
        const mergedRegistry: Record<PlanTier, PlanConfig> = { ...PLANS };
        for (const [tier, cfg] of Object.entries(latestByTier)) {
          mergedRegistry[tier as PlanTier] = cfg;
        }
        setDynamicPlansRegistry(mergedRegistry);

        const list = Object.values(mergedRegistry)
          .filter((p) => includeInactive || p.status !== "inactive")
          .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

        return list;
      }
    } catch (err) {
      console.warn("Could not query activity_logs for plan config:", err);
    }
  }

  // Fallback to in-memory dynamic plans registry
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

  const updatedConfig: PlanConfig = {
    ...existing,
    ...params.updates,
    id: tier,
    updatedAt: payload.updated_at,
  };

  if (supabase) {
    let savedToSaasPlans = false;

    // 1. Try upserting to saas_plans
    try {
      const { error: upsertError } = await (supabase as any)
        .from("saas_plans")
        .upsert({
          id: tier,
          ...payload,
        });

      if (!upsertError) {
        savedToSaasPlans = true;
        // Record Audit Log in plan_audit_logs
        try {
          await (supabase as any).from("plan_audit_logs").insert({
            plan_id: tier,
            admin_email: params.adminEmail,
            action: "update_plan",
            old_values: existing,
            new_values: updatedConfig,
          });
        } catch {
          // ignore audit log failure
        }
      }
    } catch {
      savedToSaasPlans = false;
    }

    // 2. Persist to activity_logs as resilient database store
    try {
      await (supabase as any).from("activity_logs").insert({
        action: `saas_plan_config_${tier}`,
        details: {
          ...updatedConfig,
          modified_by: params.adminEmail,
        },
      });

      // Also record audit log in activity_logs
      await (supabase as any).from("activity_logs").insert({
        action: `saas_plan_audit_${tier}`,
        details: {
          admin_email: params.adminEmail,
          action: "update_plan",
          old_values: existing,
          new_values: updatedConfig,
        },
      });
    } catch (logErr) {
      console.warn("Failed to write plan backup to activity_logs:", logErr);
    }
  }

  // Update in-memory registry immediately
  setDynamicPlansRegistry({ [tier]: updatedConfig } as any);

  return { success: true, data: updatedConfig };
}

/**
 * Retrieves audit history logs for SaaS plans.
 */
export async function getPlanAuditLogs(limit = 50): Promise<any[]> {
  const supabase = getSupabaseAdminSafe();
  if (!supabase) return [];

  // 1. Try plan_audit_logs
  try {
    const { data, error } = await (supabase as any)
      .from("plan_audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (!error && data && data.length > 0) {
      return data;
    }
  } catch {
    // Fall back to activity_logs
  }

  // 2. Query activity_logs
  try {
    const { data: logsData, error: logsErr } = await (supabase as any)
      .from("activity_logs")
      .select("*")
      .like("action", "saas_plan_audit_%")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (!logsErr && logsData) {
      return logsData.map((l: any) => ({
        id: l.id,
        plan_id: l.action.replace("saas_plan_audit_", ""),
        admin_email: l.details?.admin_email || "admin@kraftaura.in",
        action: l.details?.action || "update_plan",
        old_values: l.details?.old_values,
        new_values: l.details?.new_values,
        created_at: l.created_at,
      }));
    }
  } catch (err) {
    console.warn("Could not fetch plan audit logs:", err);
  }

  return [];
}
