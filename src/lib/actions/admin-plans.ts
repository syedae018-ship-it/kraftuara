"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { errorResponse, successResponse } from "@/lib/api-response";
import { ActionResponse } from "@/types";
import { isAdminUser } from "@/lib/services/admin-roles";
import {
  getAllPlans,
  updatePlan,
  getPlanAuditLogs,
} from "@/lib/services/plan-service";
import { PlanConfig, PlanTier } from "@/lib/feature-gating";
import { revalidatePath } from "next/cache";

/**
 * Retrieves all plans for Admin management (including inactive tiers)
 */
export async function getAdminPlansAction(): Promise<ActionResponse<PlanConfig[]>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !isAdminUser(user.email)) {
      return errorResponse("Unauthorized. Admin privileges required.");
    }

    const plans = await getAllPlans(true);
    return successResponse(plans);
  } catch (err: any) {
    return errorResponse(err.message || "Failed to load admin plans.");
  }
}

/**
 * Updates a plan's configuration, prices, limits, and features
 */
export async function updateAdminPlanAction(
  planId: PlanTier,
  updates: Partial<PlanConfig>
): Promise<ActionResponse<PlanConfig>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !isAdminUser(user.email)) {
      return errorResponse("Unauthorized. Admin privileges required.");
    }

    // Input Validations
    if (updates.name !== undefined && !updates.name.trim()) {
      return errorResponse("Plan name cannot be empty.");
    }
    if (updates.priceMonthly !== undefined && (Number(updates.priceMonthly) < 0 || isNaN(Number(updates.priceMonthly)))) {
      return errorResponse("Monthly price must be a valid positive number.");
    }
    if (updates.priceAnnual !== undefined && (Number(updates.priceAnnual) < 0 || isNaN(Number(updates.priceAnnual)))) {
      return errorResponse("Annual price must be a valid positive number.");
    }
    if (updates.productLimit !== undefined && (Number(updates.productLimit) < 1 || isNaN(Number(updates.productLimit)))) {
      return errorResponse("Product limit must be at least 1.");
    }
    if (updates.categoryLimit !== undefined && (Number(updates.categoryLimit) < 1 || isNaN(Number(updates.categoryLimit)))) {
      return errorResponse("Category limit must be at least 1.");
    }

    const result = await updatePlan({
      planId,
      updates,
      adminEmail: user.email || "admin@kraftaura.in",
    });

    if (!result.success || !result.data) {
      return errorResponse(result.error || "Failed to update plan.");
    }

    // Invalidate caches everywhere plan data is shown
    revalidatePath("/");
    revalidatePath("/choose-plan");
    revalidatePath("/dashboard/billing");
    revalidatePath("/admin/plans");

    return successResponse(result.data, `Plan "${result.data.name}" updated successfully.`);
  } catch (err: any) {
    return errorResponse(err.message || "Failed to update plan.");
  }
}

/**
 * Toggles a plan's status between active and inactive.
 */
export async function toggleAdminPlanStatusAction(
  planId: PlanTier,
  status: "active" | "inactive"
): Promise<ActionResponse<{ planId: PlanTier; status: "active" | "inactive" }>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !isAdminUser(user.email)) {
      return errorResponse("Unauthorized. Admin privileges required.");
    }

    const result = await updatePlan({
      planId,
      updates: { status },
      adminEmail: user.email || "admin@kraftaura.in",
    });

    if (!result.success) {
      return errorResponse(result.error || "Failed to toggle plan status.");
    }

    revalidatePath("/");
    revalidatePath("/choose-plan");
    revalidatePath("/dashboard/billing");
    revalidatePath("/admin/plans");

    return successResponse({ planId, status }, `Plan status changed to ${status}.`);
  } catch (err: any) {
    return errorResponse(err.message || "Failed to toggle plan status.");
  }
}

/**
 * Retrieves audit logs of plan changes
 */
export async function getAdminPlanAuditLogsAction(): Promise<ActionResponse<any[]>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !isAdminUser(user.email)) {
      return errorResponse("Unauthorized. Admin privileges required.");
    }

    const logs = await getPlanAuditLogs(50);
    return successResponse(logs);
  } catch (err: any) {
    return errorResponse(err.message || "Failed to load audit logs.");
  }
}
