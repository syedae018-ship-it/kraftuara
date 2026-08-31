"use server";

import { createServerInstance } from "@/lib/supabase/server";
import { GrowthQuestEngine, GoalType, GoalPeriod, GamificationSummary } from "@/lib/services/growth-quest-engine";
import { isAdminUser } from "@/lib/services/admin-roles";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function verifyStoreOwnership(supabase: any, storeId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  if (isAdminUser(user.email || "")) {
    return { storeId, userId: user.id };
  }

  const { data: storeRow } = await (supabase.from("stores") as any)
    .select("id, user_id")
    .eq("id", storeId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!storeRow) {
    throw new Error("Access Denied: You do not own this store.");
  }

  return { storeId, userId: user.id };
}

export async function getGrowthQuestDataAction(storeId: string): Promise<{
  success: boolean;
  data?: GamificationSummary;
  error?: string;
}> {
  try {
    if (!storeId || !UUID_REGEX.test(storeId)) {
      throw new Error("Invalid Store ID format.");
    }

    const supabase = await createServerInstance();
    const { userId } = await verifyStoreOwnership(supabase, storeId);

    const data = await GrowthQuestEngine.evaluateStoreGamification(storeId, userId, supabase);
    return { success: true, data };
  } catch (err: any) {
    console.error("Growth Quest fetch error:", err);
    return { success: false, error: err.message || "Failed to load Growth Quest data." };
  }
}

export interface CreateGoalPayload {
  title: string;
  goalType: GoalType;
  targetValue: number;
  periodType: GoalPeriod;
  startDate?: string;
  endDate?: string;
  milestones?: number[];
}

export async function createGoalAction(
  storeId: string,
  payload: CreateGoalPayload
): Promise<{ success: boolean; goalId?: string; error?: string }> {
  try {
    if (!storeId || !UUID_REGEX.test(storeId)) {
      throw new Error("Invalid Store ID format.");
    }

    const { title, goalType, targetValue, periodType } = payload;
    if (!title || title.trim().length === 0) {
      throw new Error("Goal title is required.");
    }
    if (!targetValue || isNaN(targetValue) || targetValue <= 0) {
      throw new Error("Valid positive target value is required.");
    }

    const supabase = await createServerInstance();
    const { userId } = await verifyStoreOwnership(supabase, storeId);

    // Calculate start and end dates based on periodType
    const now = new Date();
    let start = new Date();
    let end = new Date();

    if (periodType === "month") {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    } else if (periodType === "3_months") {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 3, 0, 23, 59, 59);
    } else if (periodType === "6_months") {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 6, 0, 23, 59, 59);
    } else if (periodType === "year") {
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
    } else if (periodType === "custom") {
      if (!payload.startDate || !payload.endDate) {
        throw new Error("Custom date range requires start and end dates.");
      }
      start = new Date(payload.startDate);
      end = new Date(payload.endDate);
      if (end <= start) {
        throw new Error("End date must be after start date.");
      }
    }

    // Insert Goal
    const { data: goalRow, error: goalError } = await (supabase.from("merchant_goals") as any)
      .insert({
        store_id: storeId,
        user_id: userId,
        title: title.trim(),
        goal_type: goalType,
        target_value: targetValue,
        period_type: periodType,
        start_date: start.toISOString(),
        end_date: end.toISOString(),
        status: "active",
      })
      .select()
      .single();

    if (goalError || !goalRow) {
      throw new Error(goalError?.message || "Failed to create goal in database.");
    }

    const goalId = goalRow.id;

    // Generate or Insert Milestones
    let milestoneValues = payload.milestones || [];
    if (milestoneValues.length === 0) {
      // Default 4 quarter checkpoints (25%, 50%, 75%, 100%)
      milestoneValues = [
        Math.round(targetValue * 0.25),
        Math.round(targetValue * 0.5),
        Math.round(targetValue * 0.75),
        targetValue,
      ];
    }

    // Filter duplicates and sort
    const uniqueValues = Array.from(new Set(milestoneValues)).filter((v) => v > 0).sort((a, b) => a - b);
    const milestonePayloads = uniqueValues.map((v, idx) => {
      const isFinal = v >= targetValue;
      let label = `${idx + 1}. Checkpoint: ${goalType === "revenue" || goalType === "avg_order_value" ? `₹${v.toLocaleString()}` : `${v} ${goalType === "orders_count" ? "Orders" : goalType === "units_sold" ? "Units" : "Days"}`}`;
      if (isFinal) label = "🏆 Goal Victory";

      return {
        goal_id: goalId,
        store_id: storeId,
        target_value: v,
        label,
        xp_reward: isFinal ? 150 : 50,
        is_reached: false,
      };
    });

    if (milestonePayloads.length > 0) {
      await (supabase.from("goal_milestones") as any).insert(milestonePayloads);
    }

    // Trigger instant evaluation so existing qualifying orders count immediately
    await GrowthQuestEngine.evaluateStoreGamification(storeId, userId, supabase);

    return { success: true, goalId };
  } catch (err: any) {
    console.error("Create Goal error:", err);
    return { success: false, error: err.message || "Failed to create Growth Quest goal." };
  }
}

export async function deleteGoalAction(
  storeId: string,
  goalId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!storeId || !goalId) throw new Error("Invalid parameters.");

    const supabase = await createServerInstance();
    await verifyStoreOwnership(supabase, storeId);

    const { error } = await (supabase.from("merchant_goals") as any)
      .delete()
      .eq("id", goalId)
      .eq("store_id", storeId);

    if (error) throw new Error(error.message);

    return { success: true };
  } catch (err: any) {
    console.error("Delete goal error:", err);
    return { success: false, error: err.message || "Failed to delete goal." };
  }
}

export async function recalculateGrowthQuestAction(storeId: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!storeId) throw new Error("Missing store ID.");
    const supabase = await createServerInstance();
    const { userId } = await verifyStoreOwnership(supabase, storeId);

    await GrowthQuestEngine.evaluateStoreGamification(storeId, userId, supabase);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to recalculate." };
  }
}
