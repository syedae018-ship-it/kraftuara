"use server";

import { createServerInstance } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  GrowthQuestService,
  GrowthQuestOverview,
  QuestTemplate,
  LeaderboardRankItem,
  QuestDifficulty,
  QuestSourceType,
} from "@/lib/services/growth-quest-service";

async function verifyStoreOwner(supabase: any, storeId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized: Please log in to manage your Growth Quest.");

  const { data: store } = await supabase
    .from("stores")
    .select("id, user_id")
    .eq("id", storeId)
    .maybeSingle();

  if (!store || store.user_id !== user.id) {
    throw new Error("Forbidden: You do not have permission to manage this store.");
  }

  return { userId: user.id };
}

export async function getGrowthQuestDataAction(
  storeId: string
): Promise<{ success: boolean; data?: GrowthQuestOverview; error?: string }> {
  try {
    if (!storeId) return { success: false, error: "Store ID is required." };
    const supabase = await createServerInstance();
    const { userId } = await verifyStoreOwner(supabase, storeId);

    const overview = await GrowthQuestService.evaluateStoreQuest(storeId, userId, supabase);
    return { success: true, data: overview };
  } catch (err: any) {
    console.error("Growth Quest fetch error:", err);
    return { success: false, error: err.message || "Failed to load Growth Quest data." };
  }
}

export async function getQuestTemplatesAction(): Promise<{
  success: boolean;
  templates?: QuestTemplate[];
  error?: string;
}> {
  try {
    const supabase = await createServerInstance();
    const templates = await GrowthQuestService.getTemplates(supabase);
    return { success: true, templates };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to load quest templates." };
  }
}

export interface CreateQuestPayload {
  storeId: string;
  questName: string;
  sourceType: QuestSourceType;
  templateId?: string;
  difficulty?: QuestDifficulty;
  revenueTarget?: number;
  ordersTarget?: number;
  productsTarget?: number;
  startDate?: string;
  endDate?: string;
}

export async function createMerchantQuestAction(
  payload: CreateQuestPayload
): Promise<{ success: boolean; questId?: string; error?: string }> {
  try {
    const supabase = await createServerInstance();
    const { userId } = await verifyStoreOwner(supabase, payload.storeId);

    if (!payload.questName?.trim()) {
      return { success: false, error: "Quest name is required." };
    }

    const revTarget = Math.max(0, Number(payload.revenueTarget || 0));
    const ordTarget = Math.max(0, Number(payload.ordersTarget || 0));
    const prodTarget = Math.max(0, Number(payload.productsTarget || 0));

    if (revTarget <= 0 && ordTarget <= 0 && prodTarget <= 0) {
      return { success: false, error: "Please define at least one target (Revenue, Orders, or Products sold)." };
    }

    const now = new Date();
    const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();

    const startDate = payload.startDate ? new Date(payload.startDate).toISOString() : defaultStart;
    const endDate = payload.endDate ? new Date(payload.endDate).toISOString() : defaultEnd;

    // Archive or pause any existing active quest for this store
    await (supabase.from("growth_quests") as any)
      .update({ status: "archived", updated_at: new Date().toISOString() })
      .eq("store_id", payload.storeId)
      .eq("status", "active");

    const insertData: any = {
      merchant_id: userId,
      store_id: payload.storeId,
      quest_name: payload.questName.trim(),
      source_type: payload.sourceType || "custom",
      template_id: payload.templateId || null,
      difficulty: payload.difficulty || "custom",
      start_date: startDate,
      end_date: endDate,
      revenue_target: revTarget,
      orders_target: ordTarget,
      products_target: prodTarget,
      status: "active",
    };

    const { data: newQuest, error } = await (supabase.from("growth_quests") as any)
      .insert(insertData)
      .select("id")
      .single();

    if (error || !newQuest) {
      throw new Error(error?.message || "Failed to create quest in database.");
    }

    // Trigger immediate evaluation to process any existing orders in period
    await GrowthQuestService.evaluateStoreQuest(payload.storeId, userId, supabase);

    revalidatePath("/dashboard/goals");
    return { success: true, questId: newQuest.id };
  } catch (err: any) {
    console.error("Create quest error:", err);
    return { success: false, error: err.message || "Failed to create quest." };
  }
}

export interface UpdateQuestPayload {
  questId: string;
  storeId: string;
  questName: string;
  revenueTarget?: number;
  ordersTarget?: number;
  productsTarget?: number;
  endDate?: string;
}

export async function updateMerchantQuestAction(
  payload: UpdateQuestPayload
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerInstance();
    const { userId } = await verifyStoreOwner(supabase, payload.storeId);

    const updateData: any = {
      quest_name: payload.questName.trim(),
      revenue_target: Math.max(0, Number(payload.revenueTarget || 0)),
      orders_target: Math.max(0, Number(payload.ordersTarget || 0)),
      products_target: Math.max(0, Number(payload.productsTarget || 0)),
      updated_at: new Date().toISOString(),
    };

    if (payload.endDate) {
      updateData.end_date = new Date(payload.endDate).toISOString();
    }

    const { error } = await (supabase.from("growth_quests") as any)
      .update(updateData)
      .eq("id", payload.questId)
      .eq("store_id", payload.storeId);

    if (error) throw new Error(error.message);

    await GrowthQuestService.evaluateStoreQuest(payload.storeId, userId, supabase);
    revalidatePath("/dashboard/goals");
    return { success: true };
  } catch (err: any) {
    console.error("Update quest error:", err);
    return { success: false, error: err.message || "Failed to update quest." };
  }
}

export async function pauseOrArchiveQuestAction(
  questId: string,
  storeId: string,
  newStatus: "active" | "paused" | "archived"
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerInstance();
    const { userId } = await verifyStoreOwner(supabase, storeId);

    const { error } = await (supabase.from("growth_quests") as any)
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", questId)
      .eq("store_id", storeId);

    if (error) throw new Error(error.message);

    await GrowthQuestService.evaluateStoreQuest(storeId, userId, supabase);
    revalidatePath("/dashboard/goals");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to change quest status." };
  }
}

export async function joinCraftauraQuestAction(
  craftauraQuestId: string,
  storeId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerInstance();
    const { userId } = await verifyStoreOwner(supabase, storeId);

    const { error } = await (supabase.from("craftaura_quest_participants") as any)
      .insert({
        craftaura_quest_id: craftauraQuestId,
        merchant_id: userId,
        store_id: storeId,
      })
      .select("id")
      .maybeSingle();

    if (error && !error.message?.includes("duplicate key")) {
      throw new Error(error.message);
    }

    await GrowthQuestService.evaluateStoreQuest(storeId, userId, supabase);
    revalidatePath("/dashboard/goals");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to join Craftaura Quest." };
  }
}

export async function getLeaderboardAction(
  month?: number,
  year?: number
): Promise<{ success: boolean; leaderboard?: LeaderboardRankItem[]; error?: string }> {
  try {
    const supabase = await createServerInstance();
    const leaderboard = await GrowthQuestService.getMonthlyLeaderboard(supabase, undefined, month, year);
    return { success: true, leaderboard };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to fetch leaderboard." };
  }
}
