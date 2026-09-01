"use server";

import { assertAdminSession } from "@/lib/admin/admin-auth";
import { revalidatePath } from "next/cache";
import {
  PointRuleConfig,
  DEFAULT_POINT_RULES,
  GrowthQuestService,
  SuperAdminLeaderboardEntry,
} from "@/lib/services/growth-quest-service";

export async function getAdminGrowthOverviewAction(): Promise<{
  success: boolean;
  data?: {
    totalQuests: number;
    activeQuests: number;
    completedQuests: number;
    totalPointsAwarded: number;
    activeParticipantsCount: number;
  };
  error?: string;
}> {
  try {
    const { supabase } = await assertAdminSession();

    let totalQuests = 0;
    let activeQuests = 0;
    let completedQuests = 0;
    let totalPointsAwarded = 0;
    let activeParticipantsCount = 0;

    try {
      const { count: tCount } = await supabase.from("growth_quests").select("*", { count: "exact", head: true });
      totalQuests = tCount || 0;

      const { count: aCount } = await supabase.from("growth_quests").select("*", { count: "exact", head: true }).eq("status", "active");
      activeQuests = aCount || 0;

      const { count: cCount } = await supabase.from("growth_quests").select("*", { count: "exact", head: true }).eq("status", "completed");
      completedQuests = cCount || 0;

      const { data: ptsData } = await supabase.from("growth_quest_points").select("points");
      totalPointsAwarded = (ptsData || []).reduce((s: number, p: any) => s + Number(p.points || 0), 0);

      const { count: pCount } = await supabase.from("craftaura_quest_participants").select("*", { count: "exact", head: true });
      activeParticipantsCount = pCount || 0;
    } catch {
      // Ignore
    }

    return {
      success: true,
      data: {
        totalQuests,
        activeQuests,
        completedQuests,
        totalPointsAwarded,
        activeParticipantsCount,
      },
    };
  } catch (err: any) {
    console.error("Admin overview error:", err);
    return { success: false, error: err.message || "Failed to load admin overview." };
  }
}

// ----------------- TEMPLATES CRUD -----------------

export async function getAdminTemplatesAction(): Promise<{
  success: boolean;
  templates?: any[];
  error?: string;
}> {
  try {
    const { supabase } = await assertAdminSession();
    const templates = await GrowthQuestService.getTemplates(supabase, true);
    return { success: true, templates };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to load templates." };
  }
}

export async function saveAdminTemplateAction(payload: {
  id?: string;
  name: string;
  description: string;
  difficulty: "easy" | "moderate" | "difficult";
  monthDuration?: number;
  revenueTarget: number;
  ordersTarget: number;
  productsTarget: number;
  isActive: boolean;
  sortOrder: number;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { supabase } = await assertAdminSession();

    await GrowthQuestService.saveTemplate(supabase, {
      id: payload.id || `tpl-${Date.now()}`,
      name: payload.name,
      description: payload.description,
      difficulty: payload.difficulty,
      monthDuration: payload.monthDuration || 1,
      revenueTarget: payload.revenueTarget,
      ordersTarget: payload.ordersTarget,
      productsTarget: payload.productsTarget,
      isActive: payload.isActive,
      sortOrder: payload.sortOrder,
    });

    revalidatePath("/admin/growth-quests");
    revalidatePath("/dashboard/goals");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to save template." };
  }
}

export async function deleteAdminTemplateAction(templateId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { supabase } = await assertAdminSession();
    await GrowthQuestService.deleteTemplate(supabase, templateId);

    revalidatePath("/admin/growth-quests");
    revalidatePath("/dashboard/goals");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete template." };
  }
}

// ----------------- CRAFTAURA MONTHLY QUESTS -----------------

export async function getAdminCraftauraQuestsAction(): Promise<{
  success: boolean;
  quests?: any[];
  error?: string;
}> {
  try {
    const { supabase } = await assertAdminSession();

    try {
      const { data, error } = await supabase
        .from("craftaura_quests")
        .select("*, craftaura_quest_participants(count)")
        .order("start_date", { ascending: false });

      if (!error && data) return { success: true, quests: data };
    } catch {
      // Ignore
    }

    // Backup check in activity_logs
    try {
      const { data: logs } = await supabase
        .from("activity_logs")
        .select("details")
        .eq("action", "admin_craftaura_quests_registry")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (logs?.details && Array.isArray(logs.details)) {
        return { success: true, quests: logs.details };
      }
    } catch {
      // Ignore
    }

    return {
      success: true,
      quests: [
        {
          id: "cq-default-sep",
          name: "September Craftaura Challenge",
          description: "Achieve 15 orders this month to earn 500 Quest Points and unlock the exclusive Mystery Surprise!",
          start_date: "2026-09-01T00:00:00.000Z",
          end_date: "2026-09-30T23:59:59.999Z",
          target_type: "orders",
          target_value: 15,
          points_reward: 500,
          mystery_reward_description: "Special handcrafted gift box & promotion feature on Craftaura home page",
          is_active: true,
        },
      ],
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to load Craftaura quests." };
  }
}

export async function saveAdminCraftauraQuestAction(payload: {
  id?: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  targetType: "orders" | "revenue" | "products";
  targetValue: number;
  pointsReward: number;
  mysteryRewardDescription: string;
  isActive: boolean;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { supabase } = await assertAdminSession();

    const rowData: any = {
      name: payload.name.trim(),
      description: payload.description.trim(),
      start_date: new Date(payload.startDate).toISOString(),
      end_date: new Date(payload.endDate).toISOString(),
      target_type: payload.targetType,
      target_value: Number(payload.targetValue || 0),
      points_reward: Number(payload.pointsReward || 500),
      mystery_reward_description: payload.mysteryRewardDescription.trim(),
      is_active: payload.isActive,
      updated_at: new Date().toISOString(),
    };

    try {
      if (payload.id && !payload.id.startsWith("cq-")) {
        await supabase.from("craftaura_quests").update(rowData).eq("id", payload.id);
      } else {
        await supabase.from("craftaura_quests").insert(rowData);
      }
    } catch {
      // Ignore
    }

    // Save to activity_logs backup
    try {
      const qRes = await getAdminCraftauraQuestsAction();
      const currentList = qRes.quests || [];
      const itemObj = { ...rowData, id: payload.id || `cq-${Date.now()}` };
      const idx = currentList.findIndex((q: any) => q.id === payload.id);
      let updatedList = [...currentList];
      if (idx >= 0) updatedList[idx] = itemObj;
      else updatedList.push(itemObj);

      await supabase.from("activity_logs").insert({
        action: "admin_craftaura_quests_registry",
        details: updatedList,
      });
    } catch {
      // Ignore
    }

    revalidatePath("/admin/growth-quests");
    revalidatePath("/dashboard/goals");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to save Craftaura Quest." };
  }
}

export async function deleteAdminCraftauraQuestAction(questId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { supabase } = await assertAdminSession();
    try {
      await supabase.from("craftaura_quests").delete().eq("id", questId);
    } catch {
      // Ignore
    }

    try {
      const qRes = await getAdminCraftauraQuestsAction();
      const updatedList = (qRes.quests || []).filter((q: any) => q.id !== questId);
      await supabase.from("activity_logs").insert({
        action: "admin_craftaura_quests_registry",
        details: updatedList,
      });
    } catch {
      // Ignore
    }

    revalidatePath("/admin/growth-quests");
    revalidatePath("/dashboard/goals");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete Craftaura Quest." };
  }
}

// ----------------- POINT RULES CONFIGURATION -----------------

export async function getAdminPointRulesAction(): Promise<{
  success: boolean;
  rules?: PointRuleConfig;
  error?: string;
}> {
  try {
    const { supabase } = await assertAdminSession();
    const rules = await GrowthQuestService.getPointRules(supabase);
    return { success: true, rules };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to load point rules." };
  }
}

export async function saveAdminPointRulesAction(payload: PointRuleConfig): Promise<{ success: boolean; error?: string }> {
  try {
    const { supabase } = await assertAdminSession();
    await GrowthQuestService.savePointRules(supabase, payload);

    revalidatePath("/admin/growth-quests");
    revalidatePath("/dashboard/goals");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update point rules." };
  }
}

// ----------------- LEADERBOARD & SNAPSHOTS (SUPER ADMIN ONLY) -----------------

export async function getAdminLeaderboardAction(
  month: number,
  year: number
): Promise<{
  success: boolean;
  data?: {
    isSnapshot: boolean;
    rankings: SuperAdminLeaderboardEntry[];
  };
  error?: string;
}> {
  try {
    const { supabase } = await assertAdminSession();
    const result = await GrowthQuestService.getSuperAdminLeaderboard(supabase, month, year);
    return { success: true, data: result };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to load admin leaderboard." };
  }
}

export async function createMonthlySnapshotAction(month: number, year: number): Promise<{ success: boolean; error?: string }> {
  try {
    const { supabase } = await assertAdminSession();
    const result = await GrowthQuestService.getSuperAdminLeaderboard(supabase, month, year);

    if (!result.rankings || result.rankings.length === 0) {
      return { success: false, error: "No merchant records found to snapshot for this period." };
    }

    try {
      await supabase
        .from("growth_quest_monthly_results")
        .delete()
        .eq("month", month)
        .eq("year", year);
    } catch {
      // Ignore
    }

    const insertRows = result.rankings.map((r) => ({
      month,
      year,
      merchant_id: r.storeId, // store / merchant mapping
      store_id: r.storeId,
      final_points: r.points,
      rank: r.rank,
      is_winner: r.isWinner,
      reward_status: "pending",
    }));

    try {
      await supabase.from("growth_quest_monthly_results").insert(insertRows);
    } catch {
      // Ignore
    }

    // Save snapshot in activity_logs backup
    try {
      await supabase.from("activity_logs").insert({
        action: `monthly_snapshot_${year}_${month}`,
        details: {
          month,
          year,
          rankings: result.rankings,
          created_at: new Date().toISOString(),
        },
      });
    } catch {
      // Ignore
    }

    revalidatePath("/admin/growth-quests");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to create snapshot." };
  }
}

export async function updateWinnerRewardStatusAction(
  storeId: string,
  month: number,
  year: number,
  rewardStatus: "pending" | "delivered" | "claimed"
): Promise<{ success: boolean; error?: string }> {
  try {
    const { supabase } = await assertAdminSession();

    try {
      await supabase
        .from("growth_quest_monthly_results")
        .update({ reward_status: rewardStatus })
        .eq("store_id", storeId)
        .eq("month", month)
        .eq("year", year);
    } catch {
      // Ignore
    }

    revalidatePath("/admin/growth-quests");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update reward status." };
  }
}
