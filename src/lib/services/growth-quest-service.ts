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

export interface LeaderboardRankItem {
  rank: number;
  storeId: string;
  storeName: string;
  storeSlug: string;
  logoUrl: string | null;
  points: number;
  isCurrentStore: boolean;
}

export interface GrowthQuestOverview {
  activeQuest: MerchantQuest | null;
  progress: QuestProgress | null;
  totalPoints: number;
  pointRules: PointRuleConfig;
  recentPoints: Array<{
    id: string;
    eventType: string;
    points: number;
    description: string;
    createdAt: string;
  }>;
  templates: QuestTemplate[];
  craftauraQuest: CraftauraQuestData | null;
  leaderboard: LeaderboardRankItem[];
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

export class GrowthQuestService {
  /**
   * Fetch system point rules from Supabase
   */
  static async getPointRules(supabase: any): Promise<PointRuleConfig> {
    try {
      const { data } = await (supabase.from("growth_quest_point_rules") as any)
        .select("*")
        .limit(1)
        .maybeSingle();

      if (data) {
        return {
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
        };
      }
    } catch {
      // Fallback to default
    }
    return DEFAULT_POINT_RULES;
  }

  /**
   * Fetch active templates
   */
  static async getTemplates(supabase: any): Promise<QuestTemplate[]> {
    try {
      const { data } = await (supabase.from("growth_quest_templates") as any)
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (data && data.length > 0) {
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
      // Return hardcoded defaults if table empty or query failed
    }

    return [
      {
        id: "tpl-easy",
        name: "Start Small",
        description: "A realistic challenge for small or inconsistent volume.",
        difficulty: "easy",
        monthDuration: 1,
        revenueTarget: 3000,
        ordersTarget: 5,
        productsTarget: 5,
        isActive: true,
        sortOrder: 1,
      },
      {
        id: "tpl-mod",
        name: "Build Momentum",
        description: "For merchants who already receive regular orders.",
        difficulty: "moderate",
        monthDuration: 1,
        revenueTarget: 10000,
        ordersTarget: 15,
        productsTarget: 20,
        isActive: true,
        sortOrder: 2,
      },
      {
        id: "tpl-diff",
        name: "Push Your Month",
        description: "An ambitious challenge to push your business further.",
        difficulty: "difficult",
        monthDuration: 1,
        revenueTarget: 25000,
        ordersTarget: 30,
        productsTarget: 40,
        isActive: true,
        sortOrder: 3,
      },
    ];
  }

  /**
   * Main evaluation & aggregator for a store's Growth Quest
   */
  static async evaluateStoreQuest(
    storeId: string,
    userId: string,
    supabase: any
  ): Promise<GrowthQuestOverview> {
    const rules = await this.getPointRules(supabase);
    const templates = await this.getTemplates(supabase);

    // 1. Fetch active merchant quest
    const { data: activeQuestRow } = await (supabase.from("growth_quests") as any)
      .select("*")
      .eq("store_id", storeId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let activeQuest: MerchantQuest | null = null;
    let progress: QuestProgress | null = null;

    if (activeQuestRow) {
      activeQuest = {
        id: activeQuestRow.id,
        merchantId: activeQuestRow.merchant_id,
        storeId: activeQuestRow.store_id,
        questName: activeQuestRow.quest_name,
        sourceType: activeQuestRow.source_type,
        templateId: activeQuestRow.template_id,
        difficulty: activeQuestRow.difficulty || "custom",
        startDate: activeQuestRow.start_date,
        endDate: activeQuestRow.end_date,
        revenueTarget: Number(activeQuestRow.revenue_target || 0),
        ordersTarget: Number(activeQuestRow.orders_target || 0),
        productsTarget: Number(activeQuestRow.products_target || 0),
        status: activeQuestRow.status,
        completedAt: activeQuestRow.completed_at,
        createdAt: activeQuestRow.created_at,
        updatedAt: activeQuestRow.updated_at,
      };

      // 2. Fetch real orders for this active quest period
      const { data: orderRows } = await (supabase.from("orders") as any)
        .select("id, order_number, total_amount, status, created_at, order_items(id, quantity)")
        .eq("store_id", storeId)
        .neq("status", "cancelled")
        .gte("created_at", activeQuest.startDate)
        .lte("created_at", activeQuest.endDate);

      const validOrders = orderRows || [];

      let currentRevenue = 0;
      let currentOrders = validOrders.length;
      let currentProducts = 0;

      // Calculate totals and award order/revenue/product points idempotently
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

        // Points for valid order
        if (rules.pointsPerOrder > 0) {
          await (supabase.from("growth_quest_points") as any)
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
            .maybeSingle()
            .catch(() => {});
        }

        // Points for revenue progress (e.g. 1 pt per ₹100)
        const revPoints = Math.floor(orderAmount / rules.revenueUnit) * rules.pointsPerRevenueUnit;
        if (revPoints > 0) {
          await (supabase.from("growth_quest_points") as any)
            .insert({
              merchant_id: userId,
              store_id: storeId,
              quest_id: activeQuest.id,
              event_type: "revenue_progress",
              reference_id: `rev_${order.id}`,
              points: revPoints,
              description: `Revenue milestone for Order #${order.order_number || order.id.slice(0, 6)}`,
            })
            .select("id")
            .maybeSingle()
            .catch(() => {});
        }

        // Points for product sale
        const prodPoints = orderUnits * rules.pointsPerProductSold;
        if (prodPoints > 0) {
          await (supabase.from("growth_quest_points") as any)
            .insert({
              merchant_id: userId,
              store_id: storeId,
              quest_id: activeQuest.id,
              event_type: "product_sale",
              reference_id: `prod_${order.id}`,
              points: prodPoints,
              description: `${orderUnits} item(s) sold in Order #${order.order_number || order.id.slice(0, 6)}`,
            })
            .select("id")
            .maybeSingle()
            .catch(() => {});
        }
      }

      // Calculate progress percentages
      const revTarget = activeQuest.revenueTarget;
      const ordTarget = activeQuest.ordersTarget;
      const prodTarget = activeQuest.productsTarget;

      const revPct = revTarget > 0 ? Math.min(Math.round((currentRevenue / revTarget) * 100), 100) : 0;
      const ordPct = ordTarget > 0 ? Math.min(Math.round((currentOrders / ordTarget) * 100), 100) : 0;
      const prodPct = prodTarget > 0 ? Math.min(Math.round((currentProducts / prodTarget) * 100), 100) : 0;

      // Compute primary/overall progress based on configured targets
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

          await (supabase.from("growth_quest_points") as any)
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
            .maybeSingle()
            .catch(() => {});
        }
      }

      // If 100% completed, update quest status
      const isComplete = overallPct >= 100;
      if (isComplete && activeQuest.status === "active") {
        await (supabase.from("growth_quests") as any)
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", activeQuest.id)
          .catch(() => {});
        activeQuest.status = "completed";
      }

      // Next Milestone logic
      let nextMilestonePercent = 25;
      if (overallPct >= 75) nextMilestonePercent = 100;
      else if (overallPct >= 50) nextMilestonePercent = 75;
      else if (overallPct >= 25) nextMilestonePercent = 50;

      // Primary milestone metric: revenue if set, otherwise orders
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
    }

    // 3. Craftaura Monthly Challenge
    let craftauraQuest: CraftauraQuestData | null = null;
    const now = new Date().toISOString();
    const { data: cqRow } = await (supabase.from("craftaura_quests") as any)
      .select("*")
      .eq("is_active", true)
      .lte("start_date", now)
      .gte("end_date", now)
      .order("start_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (cqRow) {
      const { data: participantRow } = await (supabase.from("craftaura_quest_participants") as any)
        .select("*")
        .eq("craftaura_quest_id", cqRow.id)
        .eq("store_id", storeId)
        .maybeSingle();

      const isJoined = Boolean(participantRow);
      let isCompleted = Boolean(participantRow?.is_completed);

      // Measure current progress for Craftaura Quest
      const { data: cqOrders } = await (supabase.from("orders") as any)
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

      // If joined and completed, award mystery points
      if (isJoined && !isCompleted && cqProgressPct >= 100) {
        const rewardPoints = Number(cqRow.points_reward || rules.craftauraQuestDefaultPoints);
        await (supabase.from("growth_quest_points") as any)
          .insert({
            merchant_id: userId,
            store_id: storeId,
            event_type: "craftaura_quest",
            reference_id: `cq_${cqRow.id}_${storeId}`,
            points: rewardPoints,
            description: `🎁 Completed ${cqRow.name}`,
          })
          .select("id")
          .maybeSingle()
          .catch(() => {});

        await (supabase.from("craftaura_quest_participants") as any)
          .update({
            is_completed: true,
            completed_at: new Date().toISOString(),
            points_awarded: rewardPoints,
          })
          .eq("id", participantRow.id)
          .catch(() => {});

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

    // 4. Fetch Total Points & Recent Points Log
    const { data: pointsRows } = await (supabase.from("growth_quest_points") as any)
      .select("id, event_type, points, description, created_at")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false })
      .limit(20);

    const recentPoints = (pointsRows || []).map((p: any) => ({
      id: p.id,
      eventType: p.event_type,
      points: Number(p.points || 0),
      description: p.description,
      createdAt: p.created_at,
    }));

    const { data: allPointsSum } = await (supabase.from("growth_quest_points") as any)
      .select("points")
      .eq("store_id", storeId);

    const totalPoints = (allPointsSum || []).reduce((sum: number, r: any) => sum + Number(r.points || 0), 0);

    // 5. Monthly Leaderboard for the current month
    const leaderboard = await this.getMonthlyLeaderboard(supabase, storeId);

    // 6. Past Quests History
    const { data: pastQuestsRows } = await (supabase.from("growth_quests") as any)
      .select("*")
      .eq("store_id", storeId)
      .neq("status", "active")
      .order("end_date", { ascending: false })
      .limit(10);

    const pastQuests = await Promise.all(
      (pastQuestsRows || []).map(async (pq: any) => {
        const { data: pqOrders } = await (supabase.from("orders") as any)
          .select("id, total_amount, order_items(quantity)")
          .eq("store_id", storeId)
          .neq("status", "cancelled")
          .gte("created_at", pq.start_date)
          .lte("created_at", pq.end_date);

        const vOrders = pqOrders || [];
        const pqRev = vOrders.reduce((sum: number, o: any) => sum + Number(o.total_amount || 0), 0);
        const pqOrd = vOrders.length;
        const pqProd = vOrders.reduce((sum: number, o: any) => {
          return sum + (o.order_items || []).reduce((iS: number, it: any) => iS + Number(it.quantity || 1), 0);
        }, 0);

        const revTarget = Number(pq.revenue_target || 0);
        const progressPct = revTarget > 0 ? Math.min(Math.round((pqRev / revTarget) * 100), 100) : 0;

        const { data: pqPointsRows } = await (supabase.from("growth_quest_points") as any)
          .select("points")
          .eq("quest_id", pq.id);

        const pointsEarned = (pqPointsRows || []).reduce((sum: number, r: any) => sum + Number(r.points || 0), 0);

        const dateObj = new Date(pq.start_date);
        const monthName = dateObj.toLocaleString("default", { month: "long", year: "numeric" });

        return {
          id: pq.id,
          questName: pq.quest_name,
          monthName,
          revenueTarget: revTarget,
          currentRevenue: pqRev,
          ordersTarget: Number(pq.orders_target || 0),
          currentOrders: pqOrd,
          productsTarget: Number(pq.products_target || 0),
          currentProducts: pqProd,
          progressPercent: progressPct,
          status: pq.status as QuestStatus,
          completedAt: pq.completed_at,
          pointsEarned,
        };
      })
    );

    const currentMonthName = new Date().toLocaleString("default", { month: "long", year: "numeric" });

    return {
      activeQuest,
      progress,
      totalPoints,
      pointRules: rules,
      recentPoints,
      templates,
      craftauraQuest,
      leaderboard,
      currentMonthName,
      pastQuests,
    };
  }

  /**
   * Get safe public leaderboard rankings for current or specific month
   */
  static async getMonthlyLeaderboard(
    supabase: any,
    currentStoreId?: string,
    month?: number,
    year?: number
  ): Promise<LeaderboardRankItem[]> {
    const targetDate = new Date();
    const targetMonth = month || targetDate.getMonth() + 1;
    const targetYear = year || targetDate.getFullYear();

    const startOfMonth = new Date(targetYear, targetMonth - 1, 1).toISOString();
    const endOfMonth = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999).toISOString();

    // Check if snapshot exists in growth_quest_monthly_results
    const { data: snapshotRows } = await (supabase.from("growth_quest_monthly_results") as any)
      .select("*, stores(id, name, slug, logo_url)")
      .eq("month", targetMonth)
      .eq("year", targetYear)
      .order("rank", { ascending: true })
      .limit(50);

    if (snapshotRows && snapshotRows.length > 0) {
      return snapshotRows.map((row: any) => ({
        rank: Number(row.rank),
        storeId: row.store_id,
        storeName: row.stores?.name || "Merchant Store",
        storeSlug: row.stores?.slug || "store",
        logoUrl: row.stores?.logo_url || null,
        points: Number(row.final_points || 0),
        isCurrentStore: Boolean(currentStoreId && row.store_id === currentStoreId),
      }));
    }

    // Otherwise calculate live from growth_quest_points in this month
    const { data: pointsGroup } = await (supabase.from("growth_quest_points") as any)
      .select("store_id, points, stores(id, name, slug, logo_url)")
      .gte("created_at", startOfMonth)
      .lte("created_at", endOfMonth);

    const storePointsMap: Record<string, { store: any; points: number }> = {};

    for (const p of pointsGroup || []) {
      if (!p.store_id) continue;
      if (!storePointsMap[p.store_id]) {
        storePointsMap[p.store_id] = {
          store: p.stores || { id: p.store_id, name: "Merchant Store", slug: "store", logo_url: null },
          points: 0,
        };
      }
      storePointsMap[p.store_id].points += Number(p.points || 0);
    }

    const sorted = Object.values(storePointsMap).sort((a, b) => b.points - a.points);

    return sorted.map((item, idx) => ({
      rank: idx + 1,
      storeId: item.store.id,
      storeName: item.store.name || "Merchant Store",
      storeSlug: item.store.slug || "store",
      logoUrl: item.store.logo_url || null,
      points: item.points,
      isCurrentStore: Boolean(currentStoreId && item.store.id === currentStoreId),
    }));
  }
}
