import { SupabaseClient } from "@supabase/supabase-js";

export type QuestDifficulty = "easy" | "moderate" | "difficult" | "custom";
export type QuestStatus = "active" | "completed" | "expired" | "paused" | "archived";
export type QuestSourceType = "custom" | "template";
export type CraftauraTargetType = "orders" | "revenue" | "products";

export interface QuestTemplate {
  id: string;
  name: string;
  description: string;
  difficulty: "easy" | "moderate" | "difficult";
  monthDuration: number;
  revenueTarget: number;
  ordersTarget: number;
  productsTarget: number;
  isActive: boolean;
  sortOrder: number;
}

export interface MerchantQuest {
  id: string;
  merchantId: string;
  storeId: string;
  questName: string;
  sourceType: QuestSourceType;
  templateId?: string | null;
  difficulty: QuestDifficulty;
  startDate: string;
  endDate: string;
  revenueTarget: number;
  ordersTarget: number;
  productsTarget: number;
  status: QuestStatus;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface QuestProgress {
  currentRevenue: number;
  revenueTarget: number;
  revenueProgressPercent: number;
  revenueRemaining: number;
  
  currentOrders: number;
  ordersTarget: number;
  ordersProgressPercent: number;
  ordersRemaining: number;

  currentProducts: number;
  productsTarget: number;
  productsProgressPercent: number;
  productsRemaining: number;

  overallProgressPercent: number;
  isComplete: boolean;
  nextMilestonePercent: number;
  nextMilestoneValue: number;
  remainingToNextMilestone: number;
  milestonesReached: number[]; // [25, 50, 75, 100]
}

export interface PointRuleConfig {
  id: string;
  pointsPerOrder: number;
  revenueUnit: number;
  pointsPerRevenueUnit: number;
  pointsPerProductSold: number;
  milestone25Points: number;
  milestone50Points: number;
  milestone75Points: number;
  milestone100Points: number;
  craftauraQuestDefaultPoints: number;
}

export interface CraftauraQuestData {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  targetType: CraftauraTargetType;
  targetValue: number;
  pointsReward: number;
  mysteryRewardDescription?: string;
  isActive: boolean;
  isJoined: boolean;
  isCompleted: boolean;
  currentValue: number;
  progressPercent: number;
}

export interface PointsBreakdown {
  ordersPoints: number;
  revenuePoints: number;
  productsPoints: number;
  milestonesPoints: number;
  craftauraPoints: number;
  totalPoints: number;
}

export interface DailyProgressPoint {
  date: string;
  label: string;
  revenue: number;
  cumulativeRevenue: number;
  orders: number;
  cumulativeOrders: number;
  points: number;
}

export interface GrowthQuestOverview {
  activeQuest: MerchantQuest | null;
  progress: QuestProgress | null;
  totalPoints: number;
  pointsBreakdown: PointsBreakdown;
  pointRules: PointRuleConfig;
  recentPoints: Array<{
    id: string;
    eventType: string;
    points: number;
    description: string;
    createdAt: string;
  }>;
  dailyProgress: DailyProgressPoint[];
  templates: QuestTemplate[];
  craftauraQuest: CraftauraQuestData | null;
  currentMonthName: string;
  pastQuests: Array<{
    id: string;
    questName: string;
    monthName: string;
    revenueTarget: number;
    currentRevenue: number;
    ordersTarget: number;
    currentOrders: number;
    productsTarget: number;
    currentProducts: number;
    progressPercent: number;
    status: QuestStatus;
    completedAt: string | null;
    pointsEarned: number;
  }>;
}

export interface SuperAdminLeaderboardEntry {
  rank: number;
  storeId: string;
  storeName: string;
  storeSlug: string;
  ownerEmail: string;
  points: number;
  ordersCount: number;
  totalRevenue: number;
  activeQuestName?: string;
  activeQuestStatus?: string;
  craftauraQuestJoined?: boolean;
  craftauraQuestCompleted?: boolean;
  isWinner: boolean;
  rewardStatus?: string;
}

export const DEFAULT_POINT_RULES: PointRuleConfig = {
  id: "00000000-0000-0000-0000-000000000001",
  pointsPerOrder: 10,
  revenueUnit: 100,
  pointsPerRevenueUnit: 1,
  pointsPerProductSold: 2,
  milestone25Points: 25,
  milestone50Points: 50,
  milestone75Points: 75,
  milestone100Points: 150,
  craftauraQuestDefaultPoints: 500,
};

export const DEFAULT_TEMPLATES: QuestTemplate[] = [
  {
    id: "tpl-easy",
    name: "Start Small",
    description: "A realistic, encouraging challenge designed for new or inconsistent sales volume.",
    difficulty: "easy",
    monthDuration: 1,
    revenueTarget: 3000,
    ordersTarget: 5,
    productsTarget: 5,
    isActive: true,
    sortOrder: 1,
  },
  {
    id: "tpl-moderate",
    name: "Build Momentum",
    description: "For merchants who already get regular orders and want to accelerate their monthly sales.",
    difficulty: "moderate",
    monthDuration: 1,
    revenueTarget: 10000,
    ordersTarget: 15,
    productsTarget: 20,
    isActive: true,
    sortOrder: 2,
  },
  {
    id: "tpl-difficult",
    name: "Push Your Month",
    description: "An ambitious challenge to push your products, order count, and monthly revenue higher.",
    difficulty: "difficult",
    monthDuration: 1,
    revenueTarget: 25000,
    ordersTarget: 30,
    productsTarget: 40,
    isActive: true,
    sortOrder: 3,
  },
];

export class GrowthQuestService {
  /**
   * Helper to fetch store settings metadata backup
   */
  private static async getStoreGrowthMetadata(supabase: any, storeId: string): Promise<any> {
    try {
      const { data } = await supabase
        .from("store_settings")
        .select("metadata")
        .eq("store_id", storeId)
        .maybeSingle();

      return data?.metadata?.growth_quest || {};
    } catch {
      return {};
    }
  }

  /**
   * Helper to write store settings metadata backup
   */
  private static async updateStoreGrowthMetadata(supabase: any, storeId: string, partial: any): Promise<void> {
    try {
      const { data } = await supabase
        .from("store_settings")
        .select("metadata")
        .eq("store_id", storeId)
        .maybeSingle();

      const currentMeta = data?.metadata || {};
      const currentGrowth = currentMeta.growth_quest || {};
      const newMeta = {
        ...currentMeta,
        growth_quest: {
          ...currentGrowth,
          ...partial,
          updated_at: new Date().toISOString(),
        },
      };

      await supabase
        .from("store_settings")
        .update({ metadata: newMeta, updated_at: new Date().toISOString() })
        .eq("store_id", storeId);
    } catch (err) {
      console.warn("Store growth metadata backup write error:", err);
    }
  }

  /**
   * Fetch point rules from Supabase (with resilient fallback)
   */
  static async getPointRules(supabase: any): Promise<PointRuleConfig> {
    try {
      const { data, error } = await supabase
        .from("growth_quest_point_rules")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        return {
          id: data.id,
          pointsPerOrder: Number(data.points_per_order ?? DEFAULT_POINT_RULES.pointsPerOrder),
          revenueUnit: Number(data.revenue_unit ?? DEFAULT_POINT_RULES.revenueUnit),
          pointsPerRevenueUnit: Number(data.points_per_revenue_unit ?? DEFAULT_POINT_RULES.pointsPerRevenueUnit),
          pointsPerProductSold: Number(data.points_per_product_sold ?? DEFAULT_POINT_RULES.pointsPerProductSold),
          milestone25Points: Number(data.milestone_25_points ?? DEFAULT_POINT_RULES.milestone25Points),
          milestone50Points: Number(data.milestone_50_points ?? DEFAULT_POINT_RULES.milestone50Points),
          milestone75Points: Number(data.milestone_75_points ?? DEFAULT_POINT_RULES.milestone75Points),
          milestone100Points: Number(data.milestone_100_points ?? DEFAULT_POINT_RULES.milestone100Points),
          craftauraQuestDefaultPoints: Number(data.craftaura_quest_default_points ?? DEFAULT_POINT_RULES.craftauraQuestDefaultPoints),
        };
      }
    } catch {
      // Fallback
    }

    // Try activity_logs store configuration backup
    try {
      const { data: logRow } = await supabase
        .from("activity_logs")
        .select("details")
        .eq("action", "admin_point_rules_config")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (logRow?.details) {
        return {
          ...DEFAULT_POINT_RULES,
          ...logRow.details,
        };
      }
    } catch {
      // Ignore
    }

    return DEFAULT_POINT_RULES;
  }

  /**
   * Save point rules
   */
  static async savePointRules(supabase: any, rules: PointRuleConfig): Promise<void> {
    try {
      await supabase
        .from("growth_quest_point_rules")
        .upsert({
          id: rules.id || DEFAULT_POINT_RULES.id,
          points_per_order: Number(rules.pointsPerOrder),
          revenue_unit: Number(rules.revenueUnit),
          points_per_revenue_unit: Number(rules.pointsPerRevenueUnit),
          points_per_product_sold: Number(rules.pointsPerProductSold),
          milestone_25_points: Number(rules.milestone25Points),
          milestone_50_points: Number(rules.milestone50Points),
          milestone_75_points: Number(rules.milestone75Points),
          milestone_100_points: Number(rules.milestone100Points),
          craftaura_quest_default_points: Number(rules.craftauraQuestDefaultPoints),
          updated_at: new Date().toISOString(),
        });
    } catch {
      // Ignore if table not present
    }

    // Always persist to activity_logs backup
    try {
      await supabase.from("activity_logs").insert({
        action: "admin_point_rules_config",
        details: rules,
      });
    } catch {
      // Ignore
    }
  }

  /**
   * Fetch active templates
   */
  static async getTemplates(supabase: any, includeInactive = false): Promise<QuestTemplate[]> {
    try {
      let query = supabase.from("growth_quest_templates").select("*").order("sort_order", { ascending: true });
      if (!includeInactive) {
        query = query.eq("is_active", true);
      }
      const { data, error } = await query;

      if (!error && data && data.length > 0) {
        return data.map((t: any) => ({
          id: t.id,
          name: t.name,
          description: t.description,
          difficulty: t.difficulty,
          monthDuration: Number(t.month_duration || 1),
          revenueTarget: Number(t.revenue_target || 0),
          ordersTarget: Number(t.orders_target || 0),
          productsTarget: Number(t.products_target || 0),
          isActive: Boolean(t.is_active),
          sortOrder: Number(t.sort_order || 0),
        }));
      }
    } catch {
      // Fallback
    }

    // Check activity_logs backup for custom templates
    try {
      const { data: logs } = await supabase
        .from("activity_logs")
        .select("details")
        .eq("action", "admin_templates_registry")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (logs?.details && Array.isArray(logs.details) && logs.details.length > 0) {
        return logs.details
          .filter((t: QuestTemplate) => includeInactive || t.isActive)
          .sort((a: QuestTemplate, b: QuestTemplate) => a.sortOrder - b.sortOrder);
      }
    } catch {
      // Ignore
    }

    return DEFAULT_TEMPLATES.filter((t) => includeInactive || t.isActive);
  }

  /**
   * Save template (Admin CRUD)
   */
  static async saveTemplate(supabase: any, template: QuestTemplate): Promise<void> {
    const row = {
      name: template.name.trim(),
      description: template.description.trim(),
      difficulty: template.difficulty,
      month_duration: Number(template.monthDuration || 1),
      revenue_target: Number(template.revenueTarget || 0),
      orders_target: Number(template.ordersTarget || 0),
      products_target: Number(template.productsTarget || 0),
      is_active: template.isActive,
      sort_order: Number(template.sortOrder || 0),
      updated_at: new Date().toISOString(),
    };

    try {
      if (template.id && !template.id.startsWith("tpl-")) {
        await supabase.from("growth_quest_templates").update(row).eq("id", template.id);
      } else {
        await supabase.from("growth_quest_templates").insert(row);
      }
    } catch {
      // Ignore if table missing
    }

    // Update backup list in activity_logs
    try {
      const all = await this.getTemplates(supabase, true);
      const existingIdx = all.findIndex((t) => t.id === template.id);
      let updatedList = [...all];
      if (existingIdx >= 0) {
        updatedList[existingIdx] = { ...template };
      } else {
        updatedList.push({ ...template, id: template.id || `tpl-${Date.now()}` });
      }

      await supabase.from("activity_logs").insert({
        action: "admin_templates_registry",
        details: updatedList,
      });
    } catch {
      // Ignore
    }
  }

  /**
   * Delete template (Admin CRUD)
   */
  static async deleteTemplate(supabase: any, templateId: string): Promise<void> {
    try {
      await supabase.from("growth_quest_templates").delete().eq("id", templateId);
    } catch {
      // Ignore
    }

    try {
      const all = await this.getTemplates(supabase, true);
      const updatedList = all.filter((t) => t.id !== templateId);
      await supabase.from("activity_logs").insert({
        action: "admin_templates_registry",
        details: updatedList,
      });
    } catch {
      // Ignore
    }
  }

  /**
   * Main evaluation & aggregator for a merchant store's Growth Quest.
   * STRICT MERCHANT PRIVACY: Does NOT expose rankings, leaderboard, or other merchants.
   */
  static async evaluateStoreQuest(
    storeId: string,
    userId: string,
    supabase: any
  ): Promise<GrowthQuestOverview> {
    const rules = await this.getPointRules(supabase);
    const templates = await this.getTemplates(supabase);

    // 1. Fetch active quest from growth_quests table or store metadata backup
    let activeQuest: MerchantQuest | null = null;
    let allQuestsList: MerchantQuest[] = [];

    try {
      const { data: questRows, error } = await supabase
        .from("growth_quests")
        .select("*")
        .eq("store_id", storeId)
        .order("created_at", { ascending: false });

      if (!error && questRows && questRows.length > 0) {
        allQuestsList = questRows.map((r: any) => ({
          id: r.id,
          merchantId: r.merchant_id,
          storeId: r.store_id,
          questName: r.quest_name,
          sourceType: r.source_type,
          templateId: r.template_id,
          difficulty: r.difficulty || "custom",
          startDate: r.start_date,
          endDate: r.end_date,
          revenueTarget: Number(r.revenue_target || 0),
          ordersTarget: Number(r.orders_target || 0),
          productsTarget: Number(r.products_target || 0),
          status: r.status,
          completedAt: r.completed_at,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        }));
        activeQuest = allQuestsList.find((q) => q.status === "active") || null;
      }
    } catch {
      // Fall through to backup
    }

    if (!activeQuest) {
      const meta = await this.getStoreGrowthMetadata(supabase, storeId);
      if (meta.active_quest && meta.active_quest.status === "active") {
        activeQuest = meta.active_quest;
      }
      if (Array.isArray(meta.past_quests)) {
        allQuestsList = meta.past_quests;
      }
    }

    let progress: QuestProgress | null = null;
    let dailyProgress: DailyProgressPoint[] = [];

    if (activeQuest) {
      // 2. Fetch real orders from Supabase canonical orders & order_items
      const { data: orderRows } = await supabase
        .from("orders")
        .select("id, order_number, total_amount, status, created_at, order_items(id, quantity, price)")
        .eq("store_id", storeId)
        .neq("status", "cancelled")
        .gte("created_at", activeQuest.startDate)
        .lte("created_at", activeQuest.endDate)
        .order("created_at", { ascending: true });

      const validOrders = orderRows || [];

      let currentRevenue = 0;
      let currentOrders = validOrders.length;
      let currentProducts = 0;

      // Group orders by date for personal progress graph
      const dailyMap: Record<string, { revenue: number; orders: number; points: number }> = {};

      // Seed all dates in the range up to current date or end date for a smooth chart
      const startD = new Date(activeQuest.startDate);
      const endD = new Date(Math.min(new Date(activeQuest.endDate).getTime(), Date.now()));
      for (let d = new Date(startD); d <= endD; d.setDate(d.getDate() + 1)) {
        const dateKey = d.toISOString().slice(0, 10);
        dailyMap[dateKey] = { revenue: 0, orders: 0, points: 0 };
      }

      // Process orders and compute points idempotently
      for (const order of validOrders) {
        const orderAmount = Number(order.total_amount || 0);
        currentRevenue += orderAmount;

        let orderUnits = 0;
        if (order.order_items && Array.isArray(order.order_items)) {
          for (const itm of order.order_items) {
            orderUnits += Number(itm.quantity || 1);
          }
        }
        currentProducts += orderUnits;

        const dateKey = order.created_at.slice(0, 10);
        if (!dailyMap[dateKey]) {
          dailyMap[dateKey] = { revenue: 0, orders: 0, points: 0 };
        }
        dailyMap[dateKey].revenue += orderAmount;
        dailyMap[dateKey].orders += 1;

        let earnedOnThisOrder = 0;

        // Points for valid order
        if (rules.pointsPerOrder > 0) {
          earnedOnThisOrder += rules.pointsPerOrder;
          try {
            await supabase
              .from("growth_quest_points")
              .insert({
                merchant_id: userId,
                store_id: storeId,
                quest_id: activeQuest.id,
                event_type: "order",
                reference_id: `order_${order.id}`,
                points: rules.pointsPerOrder,
                description: `Order #${order.order_number || order.id.slice(0, 6)} placed`,
              })
              .select("id")
              .maybeSingle();
          } catch {
            // Ignore duplicate
          }
        }

        // Points for revenue progress (e.g. 1 pt per ₹100)
        const revPoints = Math.floor(orderAmount / rules.revenueUnit) * rules.pointsPerRevenueUnit;
        if (revPoints > 0) {
          earnedOnThisOrder += revPoints;
          try {
            await supabase
              .from("growth_quest_points")
              .insert({
                merchant_id: userId,
                store_id: storeId,
                quest_id: activeQuest.id,
                event_type: "revenue_progress",
                reference_id: `rev_${order.id}`,
                points: revPoints,
                description: `Revenue for Order #${order.order_number || order.id.slice(0, 6)}`,
              })
              .select("id")
              .maybeSingle();
          } catch {
            // Ignore duplicate
          }
        }

        // Points for product units sold
        const prodPoints = orderUnits * rules.pointsPerProductSold;
        if (prodPoints > 0) {
          earnedOnThisOrder += prodPoints;
          try {
            await supabase
              .from("growth_quest_points")
              .insert({
                merchant_id: userId,
                store_id: storeId,
                quest_id: activeQuest.id,
                event_type: "product_sale",
                reference_id: `prod_${order.id}`,
                points: prodPoints,
                description: `${orderUnits} product(s) sold in Order #${order.order_number || order.id.slice(0, 6)}`,
              })
              .select("id")
              .maybeSingle();
          } catch {
            // Ignore duplicate
          }
        }

        dailyMap[dateKey].points += earnedOnThisOrder;
      }

      // Build daily cumulative progress data
      let cumRev = 0;
      let cumOrd = 0;
      const sortedDates = Object.keys(dailyMap).sort();
      for (const dKey of sortedDates) {
        cumRev += dailyMap[dKey].revenue;
        cumOrd += dailyMap[dKey].orders;
        const dObj = new Date(dKey);
        const label = dObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        dailyProgress.push({
          date: dKey,
          label,
          revenue: dailyMap[dKey].revenue,
          cumulativeRevenue: cumRev,
          orders: dailyMap[dKey].orders,
          cumulativeOrders: cumOrd,
          points: dailyMap[dKey].points,
        });
      }

      // Progress percentages
      const revTarget = activeQuest.revenueTarget;
      const ordTarget = activeQuest.ordersTarget;
      const prodTarget = activeQuest.productsTarget;

      const revPct = revTarget > 0 ? Math.min(Math.round((currentRevenue / revTarget) * 100), 100) : 0;
      const ordPct = ordTarget > 0 ? Math.min(Math.round((currentOrders / ordTarget) * 100), 100) : 0;
      const prodPct = prodTarget > 0 ? Math.min(Math.round((currentProducts / prodTarget) * 100), 100) : 0;

      const activeTargets: number[] = [];
      if (revTarget > 0) activeTargets.push(revPct);
      if (ordTarget > 0) activeTargets.push(ordPct);
      if (prodTarget > 0) activeTargets.push(prodPct);

      const overallPct = activeTargets.length > 0
        ? Math.round(activeTargets.reduce((a, b) => a + b, 0) / activeTargets.length)
        : (revTarget > 0 ? revPct : 0);

      // Check Milestones (25%, 50%, 75%, 100%)
      const milestonesReached: number[] = [];
      const milestoneThresholds = [
        { pct: 25, points: rules.milestone25Points, key: "25" },
        { pct: 50, points: rules.milestone50Points, key: "50" },
        { pct: 75, points: rules.milestone75Points, key: "75" },
        { pct: 100, points: rules.milestone100Points, key: "100" },
      ];

      for (const m of milestoneThresholds) {
        if (overallPct >= m.pct) {
          milestonesReached.push(m.pct);
          const isFullCompletion = m.pct === 100;
          const eventType = isFullCompletion ? "quest_completion" : "milestone";
          const desc = isFullCompletion
            ? `🎉 Quest Completed: ${activeQuest.questName}`
            : `🎉 ${m.pct}% Milestone reached on ${activeQuest.questName}`;

          try {
            await supabase
              .from("growth_quest_points")
              .insert({
                merchant_id: userId,
                store_id: storeId,
                quest_id: activeQuest.id,
                event_type: eventType,
                reference_id: `milestone_${activeQuest.id}_${m.key}`,
                points: m.points,
                description: desc,
              })
              .select("id")
              .maybeSingle();
          } catch {
            // Ignore duplicate
          }
        }
      }

      // Update completion status
      const isComplete = overallPct >= 100;
      if (isComplete && activeQuest.status === "active") {
        activeQuest.status = "completed";
        activeQuest.completedAt = new Date().toISOString();
        try {
          await supabase
            .from("growth_quests")
            .update({
              status: "completed",
              completed_at: activeQuest.completedAt,
              updated_at: new Date().toISOString(),
            })
            .eq("id", activeQuest.id);
        } catch {
          // Backup
        }
      }

      // Next Milestone
      let nextMilestonePercent = 25;
      if (overallPct >= 75) nextMilestonePercent = 100;
      else if (overallPct >= 50) nextMilestonePercent = 75;
      else if (overallPct >= 25) nextMilestonePercent = 50;

      const primaryTargetVal = revTarget > 0 ? revTarget : ordTarget;
      const primaryCurrentVal = revTarget > 0 ? currentRevenue : currentOrders;
      const nextMilestoneValue = Math.round((nextMilestonePercent / 100) * primaryTargetVal);
      const remainingToNextMilestone = Math.max(0, nextMilestoneValue - primaryCurrentVal);

      progress = {
        currentRevenue,
        revenueTarget: revTarget,
        revenueProgressPercent: revPct,
        revenueRemaining: Math.max(0, revTarget - currentRevenue),

        currentOrders,
        ordersTarget: ordTarget,
        ordersProgressPercent: ordPct,
        ordersRemaining: Math.max(0, ordTarget - currentOrders),

        currentProducts,
        productsTarget: prodTarget,
        productsProgressPercent: prodPct,
        productsRemaining: Math.max(0, prodTarget - currentProducts),

        overallProgressPercent: overallPct,
        isComplete,
        nextMilestonePercent,
        nextMilestoneValue,
        remainingToNextMilestone,
        milestonesReached,
      };

      // Persist latest state in store settings metadata backup
      await this.updateStoreGrowthMetadata(supabase, storeId, {
        active_quest: activeQuest,
        last_progress: progress,
      });
    }

    // 3. Platform Craftaura Quest
    let craftauraQuest: CraftauraQuestData | null = null;
    const nowIso = new Date().toISOString();

    try {
      const { data: cqRow } = await supabase
        .from("craftaura_quests")
        .select("*")
        .eq("is_active", true)
        .lte("start_date", nowIso)
        .gte("end_date", nowIso)
        .order("start_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cqRow) {
        const { data: participantRow } = await supabase
          .from("craftaura_quest_participants")
          .select("*")
          .eq("craftaura_quest_id", cqRow.id)
          .eq("store_id", storeId)
          .maybeSingle();

        const isJoined = Boolean(participantRow);
        let isCompleted = Boolean(participantRow?.is_completed);

        const { data: cqOrders } = await supabase
          .from("orders")
          .select("id, total_amount, order_items(quantity)")
          .eq("store_id", storeId)
          .neq("status", "cancelled")
          .gte("created_at", cqRow.start_date)
          .lte("created_at", cqRow.end_date);

        const validCqOrders = cqOrders || [];
        let currentVal = 0;

        if (cqRow.target_type === "revenue") {
          currentVal = validCqOrders.reduce((sum: number, o: any) => sum + Number(o.total_amount || 0), 0);
        } else if (cqRow.target_type === "orders") {
          currentVal = validCqOrders.length;
        } else if (cqRow.target_type === "products") {
          currentVal = validCqOrders.reduce((sum: number, o: any) => {
            const itemsCount = (o.order_items || []).reduce((iSum: number, itm: any) => iSum + Number(itm.quantity || 1), 0);
            return sum + itemsCount;
          }, 0);
        }

        const targetVal = Number(cqRow.target_value || 1);
        const cqProgressPct = Math.min(Math.round((currentVal / targetVal) * 100), 100);

        if (isJoined && !isCompleted && cqProgressPct >= 100) {
          const rewardPoints = Number(cqRow.points_reward || rules.craftauraQuestDefaultPoints);
          try {
            await supabase
              .from("growth_quest_points")
              .insert({
                merchant_id: userId,
                store_id: storeId,
                event_type: "craftaura_quest",
                reference_id: `cq_${cqRow.id}_${storeId}`,
                points: rewardPoints,
                description: `🎁 Completed ${cqRow.name}`,
              })
              .select("id")
              .maybeSingle();
          } catch {
            // Ignore
          }

          try {
            await supabase
              .from("craftaura_quest_participants")
              .update({
                is_completed: true,
                completed_at: new Date().toISOString(),
                points_awarded: rewardPoints,
              })
              .eq("id", participantRow.id);
          } catch {
            // Ignore
          }

          isCompleted = true;
        }

        craftauraQuest = {
          id: cqRow.id,
          name: cqRow.name,
          description: cqRow.description,
          startDate: cqRow.start_date,
          endDate: cqRow.end_date,
          targetType: cqRow.target_type,
          targetValue: targetVal,
          pointsReward: Number(cqRow.points_reward || rules.craftauraQuestDefaultPoints),
          mysteryRewardDescription: isCompleted ? cqRow.mystery_reward_description : undefined,
          isActive: Boolean(cqRow.is_active),
          isJoined,
          isCompleted,
          currentValue: currentVal,
          progressPercent: cqProgressPct,
        };
      }
    } catch {
      // Ignore
    }

    // 4. Points breakdown & total score
    let pointsBreakdown: PointsBreakdown = {
      ordersPoints: 0,
      revenuePoints: 0,
      productsPoints: 0,
      milestonesPoints: 0,
      craftauraPoints: 0,
      totalPoints: 0,
    };

    let recentPoints: Array<{ id: string; eventType: string; points: number; description: string; createdAt: string }> = [];

    try {
      const { data: pointsRows } = await supabase
        .from("growth_quest_points")
        .select("id, event_type, points, description, created_at")
        .eq("store_id", storeId)
        .order("created_at", { ascending: false });

      if (pointsRows && pointsRows.length > 0) {
        recentPoints = pointsRows.slice(0, 30).map((p: any) => ({
          id: p.id,
          eventType: p.event_type,
          points: Number(p.points || 0),
          description: p.description,
          createdAt: p.created_at,
        }));

        for (const p of pointsRows) {
          const pts = Number(p.points || 0);
          pointsBreakdown.totalPoints += pts;
          if (p.event_type === "order") pointsBreakdown.ordersPoints += pts;
          else if (p.event_type === "revenue_progress") pointsBreakdown.revenuePoints += pts;
          else if (p.event_type === "product_sale") pointsBreakdown.productsPoints += pts;
          else if (p.event_type === "milestone" || p.event_type === "quest_completion") pointsBreakdown.milestonesPoints += pts;
          else if (p.event_type === "craftaura_quest") pointsBreakdown.craftauraPoints += pts;
        }
      }
    } catch {
      // Fallback calculation from dailyProgress if table empty
      const totalFromOrders = dailyProgress.reduce((sum, d) => sum + d.points, 0);
      pointsBreakdown.totalPoints = totalFromOrders;
      pointsBreakdown.ordersPoints = totalFromOrders;
    }

    // 5. Past Quests History
    const pastQuests: Array<{
      id: string;
      questName: string;
      monthName: string;
      revenueTarget: number;
      currentRevenue: number;
      ordersTarget: number;
      currentOrders: number;
      productsTarget: number;
      currentProducts: number;
      progressPercent: number;
      status: QuestStatus;
      completedAt: string | null;
      pointsEarned: number;
    }> = [];

    const pastRows = allQuestsList.filter((q) => q.status !== "active");
    for (const pq of pastRows) {
      const { data: pqOrders } = await supabase
        .from("orders")
        .select("id, total_amount, order_items(quantity)")
        .eq("store_id", storeId)
        .neq("status", "cancelled")
        .gte("created_at", pq.startDate)
        .lte("created_at", pq.endDate);

      const vOrders = pqOrders || [];
      const pqRev = vOrders.reduce((sum: number, o: any) => sum + Number(o.total_amount || 0), 0);
      const pqOrd = vOrders.length;
      const pqProd = vOrders.reduce((sum: number, o: any) => {
        return sum + (o.order_items || []).reduce((iS: number, it: any) => iS + Number(it.quantity || 1), 0);
      }, 0);

      const revTarget = Number(pq.revenueTarget || 0);
      const progressPct = revTarget > 0 ? Math.min(Math.round((pqRev / revTarget) * 100), 100) : 0;

      const dateObj = new Date(pq.startDate);
      const monthName = dateObj.toLocaleString("default", { month: "long", year: "numeric" });

      pastQuests.push({
        id: pq.id,
        questName: pq.questName,
        monthName,
        revenueTarget: revTarget,
        currentRevenue: pqRev,
        ordersTarget: Number(pq.ordersTarget || 0),
        currentOrders: pqOrd,
        productsTarget: Number(pq.productsTarget || 0),
        currentProducts: pqProd,
        progressPercent: progressPct,
        status: pq.status,
        completedAt: pq.completedAt || null,
        pointsEarned: 0,
      });
    }

    const currentMonthName = new Date().toLocaleString("default", { month: "long", year: "numeric" });

    return {
      activeQuest,
      progress,
      totalPoints: pointsBreakdown.totalPoints,
      pointsBreakdown,
      pointRules: rules,
      recentPoints,
      dailyProgress,
      templates,
      craftauraQuest,
      currentMonthName,
      pastQuests,
    };
  }

  /**
   * Super Admin Only: Monthly Leaderboard and rankings aggregation
   */
  static async getSuperAdminLeaderboard(
    supabase: any,
    month: number,
    year: number
  ): Promise<{ isSnapshot: boolean; rankings: SuperAdminLeaderboardEntry[] }> {
    // 1. Check if preserved snapshot exists in growth_quest_monthly_results
    try {
      const { data: snapshotRows, error: snapErr } = await supabase
        .from("growth_quest_monthly_results")
        .select("*, stores(id, name, slug, user_id, profiles(email))")
        .eq("month", month)
        .eq("year", year)
        .order("rank", { ascending: true });

      if (!snapErr && snapshotRows && snapshotRows.length > 0) {
        return {
          isSnapshot: true,
          rankings: snapshotRows.map((row: any) => ({
            rank: Number(row.rank),
            storeId: row.store_id,
            storeName: row.stores?.name || "Merchant Store",
            storeSlug: row.stores?.slug || "store",
            ownerEmail: row.stores?.profiles?.email || "—",
            points: Number(row.final_points || 0),
            ordersCount: 0,
            totalRevenue: 0,
            isWinner: Boolean(row.is_winner),
            rewardStatus: row.reward_status,
          })),
        };
      }
    } catch {
      // Continue to live aggregation
    }

    // 2. Aggregate live scores from stores, orders, and points
    const startOfMonth = new Date(year, month - 1, 1).toISOString();
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999).toISOString();

    // Fetch all stores with profile emails
    const { data: storesList } = await supabase
      .from("stores")
      .select("id, name, slug, user_id, profiles(email)");

    const storeRankingsMap: Record<string, SuperAdminLeaderboardEntry> = {};

    for (const s of storesList || []) {
      storeRankingsMap[s.id] = {
        rank: 0,
        storeId: s.id,
        storeName: s.name || "Store",
        storeSlug: s.slug || "store",
        ownerEmail: s.profiles?.email || "—",
        points: 0,
        ordersCount: 0,
        totalRevenue: 0,
        isWinner: false,
        rewardStatus: "pending",
      };
    }

    // Sum points for this month
    try {
      const { data: pointsRows } = await supabase
        .from("growth_quest_points")
        .select("store_id, points")
        .gte("created_at", startOfMonth)
        .lte("created_at", endOfMonth);

      for (const p of pointsRows || []) {
        if (p.store_id && storeRankingsMap[p.store_id]) {
          storeRankingsMap[p.store_id].points += Number(p.points || 0);
        }
      }
    } catch {
      // Ignore
    }

    // Sum orders and revenue for this month
    try {
      const { data: ordersRows } = await supabase
        .from("orders")
        .select("store_id, total_amount, status")
        .neq("status", "cancelled")
        .gte("created_at", startOfMonth)
        .lte("created_at", endOfMonth);

      for (const o of ordersRows || []) {
        if (o.store_id && storeRankingsMap[o.store_id]) {
          storeRankingsMap[o.store_id].ordersCount += 1;
          storeRankingsMap[o.store_id].totalRevenue += Number(o.total_amount || 0);
        }
      }
    } catch {
      // Ignore
    }

    // Sort by points desc, then revenue desc, then orders desc
    const sorted = Object.values(storeRankingsMap)
      .sort((a, b) => b.points - a.points || b.totalRevenue - a.totalRevenue || b.ordersCount - a.ordersCount);

    const rankings: SuperAdminLeaderboardEntry[] = sorted.map((item, idx) => ({
      ...item,
      rank: idx + 1,
      isWinner: idx === 0 && item.points > 0,
    }));

    return {
      isSnapshot: false,
      rankings,
    };
  }
}
