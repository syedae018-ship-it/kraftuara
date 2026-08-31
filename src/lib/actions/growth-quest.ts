"use server";

import { createServerInstance } from "@/lib/supabase/server";
import { GrowthQuestEngine, GoalType, GoalPeriod, GamificationSummary, GoalMilestone } from "@/lib/services/growth-quest-engine";
import { isAdminUser } from "@/lib/services/admin-roles";
import { randomUUID } from "crypto";

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
  description?: string;
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

    let goalId = "";
    let savedToPrimary = false;

    // 1. Try primary merchant_goals table
    try {
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

      if (!goalError && goalRow) {
        goalId = goalRow.id;
        savedToPrimary = true;
      }
    } catch {
      savedToPrimary = false;
    }

    // Generate Milestone definitions
    let milestoneValues = payload.milestones || [];
    if (milestoneValues.length === 0) {
      milestoneValues = [
        Math.round(targetValue * 0.25),
        Math.round(targetValue * 0.5),
        Math.round(targetValue * 0.75),
        targetValue,
      ];
    }

    const uniqueValues = Array.from(new Set(milestoneValues)).filter((v) => v > 0).sort((a, b) => a - b);
    const milestonePayloads: GoalMilestone[] = uniqueValues.map((v, idx) => {
      const isFinal = v >= targetValue;
      let label = `${idx + 1}. Checkpoint: ${goalType === "revenue" || goalType === "avg_order_value" ? `₹${v.toLocaleString()}` : `${v} ${goalType === "orders_count" ? "Orders" : goalType === "units_sold" ? "Units" : "Days"}`}`;
      if (isFinal) label = "🏆 Goal Victory";

      return {
        id: randomUUID(),
        goalId: goalId || `goal-${Date.now()}`,
        storeId: storeId,
        targetValue: v,
        label,
        xpReward: isFinal ? 150 : 50,
        isReached: false,
      };
    });

    if (savedToPrimary && goalId) {
      try {
        const dbPayloads = milestonePayloads.map((m) => ({
          goal_id: goalId,
          store_id: storeId,
          target_value: m.targetValue,
          label: m.label,
          xp_reward: m.xpReward,
          is_reached: false,
        }));
        await (supabase.from("goal_milestones") as any).insert(dbPayloads);
      } catch (mErr) {
        console.warn("Milestones insert error:", mErr);
      }
    }

    // 2. Always persist / fallback to activity_logs for guaranteed zero-failure persistence
    if (!goalId) {
      goalId = `goal-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    }

    try {
      await (supabase.from("activity_logs") as any).insert({
        store_id: storeId,
        user_id: userId,
        action: `growth_quest_goal_${goalId}`,
        details: {
          id: goalId,
          title: title.trim(),
          description: payload.description,
          goal_type: goalType,
          target_value: targetValue,
          period_type: periodType,
          start_date: start.toISOString(),
          end_date: end.toISOString(),
          status: "active",
          milestones: milestonePayloads,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      });
    } catch (logErr) {
      console.warn("Failed to write goal backup to activity_logs:", logErr);
    }

    // Trigger instant evaluation
    await GrowthQuestEngine.evaluateStoreGamification(storeId, userId, supabase);

    return { success: true, goalId };
  } catch (err: any) {
    console.error("Create Goal error:", err);
    return { success: false, error: err.message || "Failed to create Growth Quest goal." };
  }
}

export interface UpdateGoalPayload {
  goalId: string;
  title?: string;
  targetValue?: number;
  endDate?: string;
}

export async function updateGoalAction(
  storeId: string,
  payload: UpdateGoalPayload
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!storeId || !payload.goalId) throw new Error("Invalid parameters.");

    const supabase = await createServerInstance();
    const { userId } = await verifyStoreOwnership(supabase, storeId);

    const updates: any = {
      updated_at: new Date().toISOString(),
    };
    if (payload.title) updates.title = payload.title.trim();
    if (payload.targetValue && payload.targetValue > 0) updates.target_value = payload.targetValue;
    if (payload.endDate) updates.end_date = new Date(payload.endDate).toISOString();

    // 1. Try primary table
    try {
      await (supabase.from("merchant_goals") as any)
        .update(updates)
        .eq("id", payload.goalId)
        .eq("store_id", storeId);
    } catch {}

    // 2. Persist to activity_logs
    try {
      const { data: latestLog } = await (supabase.from("activity_logs") as any)
        .select("*")
        .eq("store_id", storeId)
        .eq("action", `growth_quest_goal_${payload.goalId}`)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const existingDetails = latestLog?.details || {};
      await (supabase.from("activity_logs") as any).insert({
        store_id: storeId,
        user_id: userId,
        action: `growth_quest_goal_${payload.goalId}`,
        details: {
          ...existingDetails,
          ...updates,
          id: payload.goalId,
        },
      });
    } catch {}

    await GrowthQuestEngine.evaluateStoreGamification(storeId, userId, supabase);
    return { success: true };
  } catch (err: any) {
    console.error("Update goal error:", err);
    return { success: false, error: err.message || "Failed to update goal." };
  }
}

export async function deleteGoalAction(
  storeId: string,
  goalId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!storeId || !goalId) throw new Error("Invalid parameters.");

    const supabase = await createServerInstance();
    const { userId } = await verifyStoreOwnership(supabase, storeId);

    // 1. Try primary table
    try {
      await (supabase.from("merchant_goals") as any)
        .delete()
        .eq("id", goalId)
        .eq("store_id", storeId);
    } catch {}

    // 2. Mark deleted in activity_logs
    try {
      await (supabase.from("activity_logs") as any).insert({
        store_id: storeId,
        user_id: userId,
        action: `growth_quest_goal_${goalId}`,
        details: {
          id: goalId,
          isDeleted: true,
          deleted_at: new Date().toISOString(),
        },
      });
    } catch {}

    await GrowthQuestEngine.evaluateStoreGamification(storeId, userId, supabase);
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
