"use server";

import { assertAdminSession } from "@/lib/admin/admin-auth";
import { revalidatePath } from "next/cache";
import { PointRuleConfig, DEFAULT_POINT_RULES } from "@/lib/services/growth-quest-service";

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

    const { count: totalQuests } = await (supabase.from("growth_quests") as any)
      .select("*", { count: "exact", head: true });

    const { count: activeQuests } = await (supabase.from("growth_quests") as any)
      .select("*", { count: "exact", head: true })
      .eq("status", "active");

    const { count: completedQuests } = await (supabase.from("growth_quests") as any)
      .select("*", { count: "exact", head: true })
      .eq("status", "completed");

    const { data: pointsData } = await (supabase.from("growth_quest_points") as any)
      .select("points");

    const totalPointsAwarded = (pointsData || []).reduce((s: number, p: any) => s + Number(p.points || 0), 0);

    const { count: activeParticipantsCount } = await (supabase.from("craftaura_quest_participants") as any)
      .select("*", { count: "exact", head: true });

    return {
      success: true,
      data: {
        totalQuests: totalQuests || 0,
        activeQuests: activeQuests || 0,
        completedQuests: completedQuests || 0,
        totalPointsAwarded,
        activeParticipantsCount: activeParticipantsCount || 0,
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
    const { data, error } = await (supabase.from("growth_quest_templates") as any)
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) throw error;
    return { success: true, templates: data || [] };
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

    const rowData: any = {
      name: payload.name.trim(),
      description: payload.description.trim(),
      difficulty: payload.difficulty,
      month_duration: Number(payload.monthDuration || 1),
      revenue_target: Number(payload.revenueTarget || 0),
      orders_target: Number(payload.ordersTarget || 0),
      products_target: Number(payload.productsTarget || 0),
      is_active: payload.isActive,
      sort_order: Number(payload.sortOrder || 0),
      updated_at: new Date().toISOString(),
    };

    if (payload.id) {
      const { error } = await (supabase.from("growth_quest_templates") as any)
        .update(rowData)
        .eq("id", payload.id);
      if (error) throw error;
    } else {
      const { error } = await (supabase.from("growth_quest_templates") as any)
        .insert(rowData);
      if (error) throw error;
    }

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
    const { error } = await (supabase.from("growth_quest_templates") as any)
      .delete()
      .eq("id", templateId);

    if (error) throw error;
    revalidatePath("/admin/growth-quests");
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
    const { data, error } = await (supabase.from("craftaura_quests") as any)
      .select("*, craftaura_quest_participants(count)")
      .order("start_date", { ascending: false });

    if (error) throw error;
    return { success: true, quests: data || [] };
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

    if (payload.id) {
      const { error } = await (supabase.from("craftaura_quests") as any)
        .update(rowData)
        .eq("id", payload.id);
      if (error) throw error;
    } else {
      const { error } = await (supabase.from("craftaura_quests") as any)
        .insert(rowData);
      if (error) throw error;
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
    const { error } = await (supabase.from("craftaura_quests") as any)
      .delete()
      .eq("id", questId);

    if (error) throw error;
    revalidatePath("/admin/growth-quests");
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
    const { data } = await (supabase.from("growth_quest_point_rules") as any)
      .select("*")
      .limit(1)
      .maybeSingle();

    if (data) {
      return {
        success: true,
        rules: {
          id: data.id,
          pointsPerOrder: Number(data.points_per_order ?? 10),
          revenueUnit: Number(data.revenue_unit ?? 100),
          pointsPerRevenueUnit: Number(data.points_per_revenue_unit ?? 1),
          pointsPerProductSold: Number(data.points_per_product_sold ?? 2),
          milestone25Points: Number(data.milestone_25_points ?? 25),
          milestone50Points: Number(data.milestone_50_points ?? 50),
          milestone75Points: Number(data.milestone_75_points ?? 75),
          milestone100Points: Number(data.milestone_100_points ?? 150),
          craftauraQuestDefaultPoints: Number(data.craftaura_quest_default_points ?? 500),
        },
      };
    }
    return { success: true, rules: DEFAULT_POINT_RULES };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to load point rules." };
  }
}

export async function saveAdminPointRulesAction(payload: PointRuleConfig): Promise<{ success: boolean; error?: string }> {
  try {
    const { supabase } = await assertAdminSession();

    const rowData: any = {
      points_per_order: Number(payload.pointsPerOrder || 10),
      revenue_unit: Number(payload.revenueUnit || 100),
      points_per_revenue_unit: Number(payload.pointsPerRevenueUnit || 1),
      points_per_product_sold: Number(payload.pointsPerProductSold || 2),
      milestone_25_points: Number(payload.milestone25Points || 25),
      milestone_50_points: Number(payload.milestone50Points || 50),
      milestone_75_points: Number(payload.milestone75Points || 75),
      milestone_100_points: Number(payload.milestone100Points || 150),
      craftaura_quest_default_points: Number(payload.craftauraQuestDefaultPoints || 500),
      updated_at: new Date().toISOString(),
    };

    const { error } = await (supabase.from("growth_quest_point_rules") as any)
      .upsert({ id: payload.id || DEFAULT_POINT_RULES.id, ...rowData });

    if (error) throw error;
    revalidatePath("/admin/growth-quests");
    revalidatePath("/dashboard/goals");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update point rules." };
  }
}

// ----------------- LEADERBOARD & SNAPSHOTS -----------------

export async function getAdminLeaderboardAction(month: number, year: number): Promise<{
  success: boolean;
  data?: {
    isSnapshot: boolean;
    rankings: Array<{
      rank: number;
      storeId: string;
      storeName: string;
      storeSlug: string;
      ownerEmail?: string;
      points: number;
      isWinner: boolean;
      rewardStatus?: string;
    }>;
  };
  error?: string;
}> {
  try {
    const { supabase } = await assertAdminSession();

    // 1. Check if snapshot exists
    const { data: snapshotRows } = await (supabase.from("growth_quest_monthly_results") as any)
      .select("*, stores(id, name, slug, user_id, profiles(email))")
      .eq("month", month)
      .eq("year", year)
      .order("rank", { ascending: true });

    if (snapshotRows && snapshotRows.length > 0) {
      return {
        success: true,
        data: {
          isSnapshot: true,
          rankings: snapshotRows.map((row: any) => ({
            rank: row.rank,
            storeId: row.store_id,
            storeName: row.stores?.name || "Merchant Store",
            storeSlug: row.stores?.slug || "store",
            ownerEmail: row.stores?.profiles?.email || "—",
            points: Number(row.final_points || 0),
            isWinner: Boolean(row.is_winner),
            rewardStatus: row.reward_status,
          })),
        },
      };
    }

    // 2. Live points calculation for the month
    const startOfMonth = new Date(year, month - 1, 1).toISOString();
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999).toISOString();

    const { data: pointsRows } = await (supabase.from("growth_quest_points") as any)
      .select("store_id, points, stores(id, name, slug, user_id, profiles(email))")
      .gte("created_at", startOfMonth)
      .lte("created_at", endOfMonth);

    const storeMap: Record<string, any> = {};
    for (const p of pointsRows || []) {
      if (!p.store_id) continue;
      if (!storeMap[p.store_id]) {
        storeMap[p.store_id] = {
          storeId: p.store_id,
          storeName: p.stores?.name || "Merchant Store",
          storeSlug: p.stores?.slug || "store",
          ownerEmail: p.stores?.profiles?.email || "—",
          points: 0,
        };
      }
      storeMap[p.store_id].points += Number(p.points || 0);
    }

    const sorted = Object.values(storeMap).sort((a: any, b: any) => b.points - a.points);
    const rankings = sorted.map((s: any, idx: number) => ({
      rank: idx + 1,
      storeId: s.storeId,
      storeName: s.storeName,
      storeSlug: s.storeSlug,
      ownerEmail: s.ownerEmail,
      points: s.points,
      isWinner: idx === 0 && s.points > 0,
      rewardStatus: "pending",
    }));

    return {
      success: true,
      data: {
        isSnapshot: false,
        rankings,
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to load admin leaderboard." };
  }
}

export async function createMonthlySnapshotAction(month: number, year: number): Promise<{ success: boolean; error?: string }> {
  try {
    const { supabase } = await assertAdminSession();

    // Get current live points for that month
    const startOfMonth = new Date(year, month - 1, 1).toISOString();
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999).toISOString();

    const { data: pointsRows } = await (supabase.from("growth_quest_points") as any)
      .select("store_id, merchant_id, points")
      .gte("created_at", startOfMonth)
      .lte("created_at", endOfMonth);

    const storeMap: Record<string, { merchantId: string; points: number }> = {};
    for (const p of pointsRows || []) {
      if (!p.store_id) continue;
      if (!storeMap[p.store_id]) {
        storeMap[p.store_id] = { merchantId: p.merchant_id, points: 0 };
      }
      storeMap[p.store_id].points += Number(p.points || 0);
    }

    const sorted = Object.entries(storeMap).sort((a, b) => b[1].points - a[1].points);

    if (sorted.length === 0) {
      return { success: false, error: "No merchant points found for this period to snapshot." };
    }

    // Delete existing snapshot for this month/year before rewriting
    await (supabase.from("growth_quest_monthly_results") as any)
      .delete()
      .eq("month", month)
      .eq("year", year);

    const insertRows = sorted.map(([sId, val], idx) => ({
      month,
      year,
      merchant_id: val.merchantId,
      store_id: sId,
      final_points: val.points,
      rank: idx + 1,
      is_winner: idx === 0 && val.points > 0,
      reward_status: "pending",
    }));

    const { error: insErr } = await (supabase.from("growth_quest_monthly_results") as any)
      .insert(insertRows);

    if (insErr) throw insErr;

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

    const { error } = await (supabase.from("growth_quest_monthly_results") as any)
      .update({ reward_status: rewardStatus })
      .eq("store_id", storeId)
      .eq("month", month)
      .eq("year", year);

    if (error) throw error;
    revalidatePath("/admin/growth-quests");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update reward status." };
  }
}
