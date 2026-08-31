import { SupabaseClient } from "@supabase/supabase-js";

export type GoalType = "revenue" | "orders_count" | "units_sold" | "avg_order_value" | "selling_streak";
export type GoalPeriod = "month" | "3_months" | "6_months" | "year" | "custom";
export type GoalStatus = "active" | "completed" | "expired" | "archived";

export interface GoalMilestone {
  id: string;
  goalId: string;
  storeId: string;
  targetValue: number;
  label: string;
  xpReward: number;
  isReached: boolean;
  reachedAt?: string | null;
}

export interface MerchantGoal {
  id: string;
  storeId: string;
  userId: string;
  title: string;
  description?: string;
  goalType: GoalType;
  targetValue: number;
  periodType: GoalPeriod;
  startDate: string;
  endDate: string;
  status: GoalStatus;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  // Dynamic Real Metrics Calculated from Real Orders
  currentValue: number;
  progressPercent: number;
  remainingValue: number;
  milestones: GoalMilestone[];
  nextMilestone?: GoalMilestone | null;
  daysRemaining: number;
  isExpired: boolean;
}

export interface LevelInfo {
  level: number;
  title: string;
  minXp: number;
  maxXp: number;
  nextLevelXp: number;
  progressPercent: number;
  badge: string;
}

export interface AchievementDefinition {
  key: string;
  title: string;
  description: string;
  icon: string;
  category: "orders" | "revenue" | "streaks" | "goals";
  xpReward: number;
}

export interface MerchantAchievementItem extends AchievementDefinition {
  isUnlocked: boolean;
  unlockedAt?: string | null;
}

export interface GamificationSummary {
  xp: number;
  levelInfo: LevelInfo;
  currentStreakDays: number;
  longestStreakDays: number;
  lastSaleDate: string | null;
  highestDailyRevenue: number;
  highestDailyOrders: number;
  highestMonthlyRevenue: number;
  highestMonthlyOrders: number;
  activeGoals: MerchantGoal[];
  completedGoals: MerchantGoal[];
  achievements: MerchantAchievementItem[];
  recentXpEvents: Array<{
    id: string;
    source: string;
    xpAmount: number;
    description: string;
    createdAt: string;
  }>;
  suggestedGoals: Array<{
    title: string;
    goalType: GoalType;
    targetValue: number;
    periodType: GoalPeriod;
    reason: string;
  }>;
}

// Centralized Level Thresholds Configuration
export const LEVEL_THRESHOLDS: Array<{ level: number; title: string; minXp: number; maxXp: number; badge: string }> = [
  { level: 1, title: "Getting Started", minXp: 0, maxXp: 249, badge: "🌱" },
  { level: 2, title: "Active Seller", minXp: 250, maxXp: 699, badge: "⚡" },
  { level: 3, title: "Growing Seller", minXp: 700, maxXp: 1499, badge: "🚀" },
  { level: 4, title: "Rising Seller", minXp: 1500, maxXp: 2999, badge: "💎" },
  { level: 5, title: "Power Seller", minXp: 3000, maxXp: 5999, badge: "👑" },
  { level: 6, title: "Elite Merchant", minXp: 6000, maxXp: 999999, badge: "🏆" },
];

export function getLevelInfo(totalXp: number): LevelInfo {
  const current = LEVEL_THRESHOLDS.find((l) => totalXp >= l.minXp && totalXp <= l.maxXp) || LEVEL_THRESHOLDS[0];
  const nextLevel = LEVEL_THRESHOLDS.find((l) => l.level === current.level + 1);

  const range = nextLevel ? nextLevel.minXp - current.minXp : 1000;
  const progressInside = totalXp - current.minXp;
  const progressPercent = nextLevel ? Math.min(Math.max((progressInside / range) * 100, 0), 100) : 100;

  return {
    level: current.level,
    title: current.title,
    minXp: current.minXp,
    maxXp: current.maxXp,
    nextLevelXp: nextLevel ? nextLevel.minXp : current.maxXp,
    progressPercent: Math.round(progressPercent),
    badge: current.badge,
  };
}

// Master Achievement Registry
export const ALL_ACHIEVEMENTS: AchievementDefinition[] = [
  { key: "first_order", title: "First Sale", description: "Receive your first storefront order", icon: "🎉", category: "orders", xpReward: 100 },
  { key: "orders_10", title: "Double Digits", description: "Reach 10 total customer orders", icon: "📦", category: "orders", xpReward: 200 },
  { key: "orders_25", title: "Order Acceleration", description: "Reach 25 total customer orders", icon: "🚀", category: "orders", xpReward: 350 },
  { key: "orders_50", title: "Half Century", description: "Reach 50 total customer orders", icon: "🛡️", category: "orders", xpReward: 500 },
  { key: "orders_100", title: "Centurion Store", description: "Reach 100 total customer orders", icon: "👑", category: "orders", xpReward: 1000 },
  
  { key: "revenue_5k", title: "₹5K Milestone", description: "Generate ₹5,000 in real order volume", icon: "💰", category: "revenue", xpReward: 150 },
  { key: "revenue_10k", title: "₹10K Club", description: "Generate ₹10,000 in real order volume", icon: "💎", category: "revenue", xpReward: 300 },
  { key: "revenue_25k", title: "₹25K Growth", description: "Generate ₹25,000 in real order volume", icon: "🌟", category: "revenue", xpReward: 600 },
  { key: "revenue_50k", title: "₹50K Powerhouse", description: "Generate ₹50,000 in real order volume", icon: "⚡", category: "revenue", xpReward: 1200 },
  { key: "revenue_100k", title: "₹100K Elite", description: "Generate ₹100,000 in real order volume", icon: "🏆", category: "revenue", xpReward: 2500 },

  { key: "streak_3", title: "On Fire", description: "3 consecutive days with customer sales", icon: "🔥", category: "streaks", xpReward: 150 },
  { key: "streak_7", title: "Week of Wins", description: "7 consecutive days with customer sales", icon: "⚡", category: "streaks", xpReward: 350 },
  { key: "streak_14", title: "Fortnight Flame", description: "14 consecutive days with customer sales", icon: "🔥", category: "streaks", xpReward: 750 },
  
  { key: "goal_completed", title: "Quest Champion", description: "Complete your first Growth Quest goal 100%", icon: "🎯", category: "goals", xpReward: 250 },
];

export class GrowthQuestEngine {
  /**
   * Evaluates all merchant goals, streaks, milestones, XP, and achievements
   * derived strictly from authentic database records in `public.orders`.
   */
  static async evaluateStoreGamification(
    storeId: string,
    userId: string,
    supabase: any
  ): Promise<GamificationSummary> {
    // 1. Fetch all store qualifying orders (excluding cancelled)
    const { data: rawOrders } = await (supabase.from("orders") as any)
      .select("id, total_amount, status, created_at")
      .eq("store_id", storeId)
      .order("created_at", { ascending: true });

    const allOrders = (rawOrders || []).filter((o: any) => o.status !== "cancelled");
    const totalLifetimeRevenue = allOrders.reduce((sum: number, o: any) => sum + (Number(o.total_amount) || 0), 0);
    const totalLifetimeOrders = allOrders.length;

    // 2. Fetch order items to count units sold if needed
    const orderIds = allOrders.map((o: any) => o.id);
    let itemsByOrderId: Record<string, number> = {};
    if (orderIds.length > 0) {
      try {
        const { data: rawItems } = await (supabase.from("order_items") as any)
          .select("order_id, quantity")
          .in("order_id", orderIds);
        if (rawItems) {
          rawItems.forEach((itm: any) => {
            itemsByOrderId[itm.order_id] = (itemsByOrderId[itm.order_id] || 0) + (Number(itm.quantity) || 1);
          });
        }
      } catch (err) {
        console.warn("Order items query fallback:", err);
      }
    }

    // 3. Compute Streak and Personal Best Records
    const dailyStats: Record<string, { revenue: number; orders: number; units: number }> = {};
    const monthlyStats: Record<string, { revenue: number; orders: number }> = {};

    allOrders.forEach((o: any) => {
      const dateStr = (o.created_at || "").split("T")[0];
      const monthStr = dateStr.substring(0, 7); // YYYY-MM
      const amount = Number(o.total_amount) || 0;
      const units = itemsByOrderId[o.id] || 1;

      if (!dailyStats[dateStr]) dailyStats[dateStr] = { revenue: 0, orders: 0, units: 0 };
      dailyStats[dateStr].revenue += amount;
      dailyStats[dateStr].orders += 1;
      dailyStats[dateStr].units += units;

      if (!monthlyStats[monthStr]) monthlyStats[monthStr] = { revenue: 0, orders: 0 };
      monthlyStats[monthStr].revenue += amount;
      monthlyStats[monthStr].orders += 1;
    });

    // Personal Records
    let highestDailyRevenue = 0;
    let highestDailyOrders = 0;
    Object.values(dailyStats).forEach((d) => {
      if (d.revenue > highestDailyRevenue) highestDailyRevenue = d.revenue;
      if (d.orders > highestDailyOrders) highestDailyOrders = d.orders;
    });

    let highestMonthlyRevenue = 0;
    let highestMonthlyOrders = 0;
    Object.values(monthlyStats).forEach((m) => {
      if (m.revenue > highestMonthlyRevenue) highestMonthlyRevenue = m.revenue;
      if (m.orders > highestMonthlyOrders) highestMonthlyOrders = m.orders;
    });

    // Calculate Active Calendar Selling Streaks
    const saleDates = Object.keys(dailyStats).sort();
    let currentStreakDays = 0;
    let longestStreakDays = 0;
    let tempStreak = 0;
    let lastSaleDate: string | null = saleDates.length > 0 ? saleDates[saleDates.length - 1] : null;

    if (saleDates.length > 0) {
      for (let i = 0; i < saleDates.length; i++) {
        if (i === 0) {
          tempStreak = 1;
        } else {
          const prev = new Date(saleDates[i - 1]);
          const curr = new Date(saleDates[i]);
          const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays === 1) {
            tempStreak += 1;
          } else if (diffDays > 1) {
            tempStreak = 1;
          }
        }
        if (tempStreak > longestStreakDays) longestStreakDays = tempStreak;
      }

      // Check if current streak extends to today or yesterday
      const today = new Date().toISOString().split("T")[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
      const lastDate = saleDates[saleDates.length - 1];

      if (lastDate === today || lastDate === yesterday) {
        currentStreakDays = tempStreak;
      } else {
        currentStreakDays = 0;
      }
    }

    // 4. Fetch stored goals & milestones (with resilient fallback to activity_logs)
    let rawGoals: any[] = [];
    let isPrimaryGoalsTable = true;

    try {
      const { data, error } = await (supabase.from("merchant_goals") as any)
        .select("*")
        .eq("store_id", storeId)
        .order("created_at", { ascending: false });

      if (error) {
        isPrimaryGoalsTable = false;
      } else if (data) {
        rawGoals = data;
      }
    } catch {
      isPrimaryGoalsTable = false;
    }

    // Fallback to activity_logs if primary table is not yet provisioned in Supabase
    if (!isPrimaryGoalsTable) {
      try {
        const { data: logGoals } = await (supabase.from("activity_logs") as any)
          .select("*")
          .eq("store_id", storeId)
          .like("action", "growth_quest_goal_%")
          .order("created_at", { ascending: false });

        if (logGoals) {
          const activeMap: Record<string, any> = {};
          logGoals.forEach((l: any) => {
            const goalId = l.action.replace("growth_quest_goal_", "");
            if (!activeMap[goalId] && l.details) {
              if (l.details.isDeleted) {
                activeMap[goalId] = { isDeleted: true };
              } else {
                activeMap[goalId] = {
                  id: goalId,
                  store_id: storeId,
                  user_id: userId,
                  ...l.details,
                };
              }
            }
          });
          rawGoals = Object.values(activeMap).filter((g) => !g.isDeleted);
        }
      } catch (err) {
        console.warn("Goals activity_logs fallback query error:", err);
      }
    }

    const goalIds = (rawGoals || []).map((g: any) => g.id);
    let milestonesByGoalId: Record<string, GoalMilestone[]> = {};

    if (goalIds.length > 0) {
      if (isPrimaryGoalsTable) {
        try {
          const { data: rawMilestones } = await (supabase.from("goal_milestones") as any)
            .select("*")
            .in("goal_id", goalIds)
            .order("target_value", { ascending: true });

          if (rawMilestones) {
            rawMilestones.forEach((m: any) => {
              if (!milestonesByGoalId[m.goal_id]) milestonesByGoalId[m.goal_id] = [];
              milestonesByGoalId[m.goal_id].push({
                id: m.id,
                goalId: m.goal_id,
                storeId: m.store_id,
                targetValue: Number(m.target_value),
                label: m.label,
                xpReward: Number(m.xp_reward) || 50,
                isReached: Boolean(m.is_reached),
                reachedAt: m.reached_at,
              });
            });
          }
        } catch {
          // ignore
        }
      } else {
        // Fallback for milestones in activity_logs
        rawGoals.forEach((g: any) => {
          if (Array.isArray(g.milestones)) {
            milestonesByGoalId[g.id] = g.milestones;
          }
        });
      }
    }

    // 5. Evaluate Goals Progress & Milestones Dynamically
    const now = new Date();
    const evaluatedGoals: MerchantGoal[] = [];

    for (const g of rawGoals || []) {
      const start = new Date(g.start_date || g.startDate);
      const end = new Date(g.end_date || g.endDate);
      const isExpired = now > end && g.status === "active";
      const targetVal = Number(g.target_value || g.targetValue) || 1;
      const gType = (g.goal_type || g.goalType || "revenue") as GoalType;

      // Filter qualifying orders within the goal date window
      const windowOrders = allOrders.filter((o: any) => {
        const orderDate = new Date(o.created_at);
        return orderDate >= start && orderDate <= end;
      });

      let calculatedValue = 0;

      switch (gType) {
        case "revenue":
          calculatedValue = windowOrders.reduce((sum: number, o: any) => sum + (Number(o.total_amount) || 0), 0);
          break;
        case "orders_count":
          calculatedValue = windowOrders.length;
          break;
        case "units_sold":
          calculatedValue = windowOrders.reduce((sum: number, o: any) => sum + (itemsByOrderId[o.id] || 1), 0);
          break;
        case "avg_order_value":
          const count = windowOrders.length;
          const rev = windowOrders.reduce((sum: number, o: any) => sum + (Number(o.total_amount) || 0), 0);
          calculatedValue = count > 0 ? Math.round(rev / count) : 0;
          break;
        case "selling_streak":
          calculatedValue = currentStreakDays;
          break;
        default:
          calculatedValue = 0;
      }

      const progressPercent = Math.min(Math.round((calculatedValue / targetVal) * 100), 100);
      const remainingValue = Math.max(targetVal - calculatedValue, 0);
      const daysRemaining = Math.max(Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)), 0);

      // Evaluate milestones for this goal
      const milestones = milestonesByGoalId[g.id] || [];
      let updatedMilestones: GoalMilestone[] = [];

      for (const m of milestones) {
        const isReachedNow = calculatedValue >= m.targetValue;
        if (isReachedNow && !m.isReached) {
          // Mark reached in database & award milestone XP
          if (isPrimaryGoalsTable) {
            try {
              await (supabase.from("goal_milestones") as any)
                .update({ is_reached: true, reached_at: new Date().toISOString() })
                .eq("id", m.id);
            } catch {}
          }

          await this.awardXp(
            storeId,
            userId,
            "milestone",
            m.id,
            m.xpReward,
            `Milestone Reached: ${m.label} for ${g.title}`,
            supabase
          );

          updatedMilestones.push({ ...m, isReached: true, reachedAt: new Date().toISOString() });
        } else {
          updatedMilestones.push(m);
        }
      }

      // Check Goal 100% Completion
      let currentStatus: GoalStatus = g.status;
      if (progressPercent >= 100 && currentStatus === "active") {
        currentStatus = "completed";
        if (isPrimaryGoalsTable) {
          try {
            await (supabase.from("merchant_goals") as any)
              .update({ status: "completed", completed_at: new Date().toISOString() })
              .eq("id", g.id);
          } catch {}
        }

        // Award Goal Completion XP
        await this.awardXp(
          storeId,
          userId,
          "goal_completed",
          g.id,
          250,
          `Growth Quest Completed: ${g.title}`,
          supabase
        );
      } else if (isExpired && currentStatus === "active") {
        currentStatus = "expired";
        if (isPrimaryGoalsTable) {
          try {
            await (supabase.from("merchant_goals") as any)
              .update({ status: "expired" })
              .eq("id", g.id);
          } catch {}
        }
      }

      const nextMilestone = updatedMilestones.find((m) => !m.isReached) || null;

      evaluatedGoals.push({
        id: g.id,
        storeId: g.store_id || storeId,
        userId: g.user_id || userId,
        title: g.title,
        description: g.description,
        goalType: gType,
        targetValue: targetVal,
        periodType: g.period_type || g.periodType || "month",
        startDate: g.start_date || g.startDate,
        endDate: g.end_date || g.endDate,
        status: currentStatus,
        completedAt: g.completed_at || g.completedAt,
        createdAt: g.created_at || g.createdAt || new Date().toISOString(),
        updatedAt: g.updated_at || g.updatedAt || new Date().toISOString(),
        currentValue: calculatedValue,
        progressPercent,
        remainingValue,
        milestones: updatedMilestones,
        nextMilestone,
        daysRemaining,
        isExpired,
      });
    }

    // 6. Evaluate and Unlock Achievements
    await this.evaluateAchievements(
      storeId,
      userId,
      {
        totalRevenue: totalLifetimeRevenue,
        totalOrders: totalLifetimeOrders,
        longestStreak: longestStreakDays,
        completedGoalsCount: evaluatedGoals.filter((g) => g.status === "completed").length,
      },
      supabase
    );

    // 7. Calculate and Sync Total XP & Gamification Profile
    let xpLogs: any[] = [];
    try {
      const { data } = await (supabase.from("merchant_xp_log") as any)
        .select("*")
        .eq("store_id", storeId)
        .order("created_at", { ascending: false });
      if (data) xpLogs = data;
    } catch {
      // Fallback from activity_logs
      try {
        const { data: altLogs } = await (supabase.from("activity_logs") as any)
          .select("*")
          .eq("store_id", storeId)
          .like("action", "growth_quest_xp_%")
          .order("created_at", { ascending: false });
        if (altLogs) {
          xpLogs = altLogs.map((l: any) => ({
            id: l.id,
            source: l.details?.source || "activity",
            source_id: l.details?.source_id,
            xp_amount: l.details?.xp_amount || 50,
            description: l.details?.description || l.action,
            created_at: l.created_at,
          }));
        }
      } catch {}
    }

    const totalXp = (xpLogs || []).reduce((sum: number, l: any) => sum + (Number(l.xp_amount) || 0), 0);
    const levelInfo = getLevelInfo(totalXp);

    // Upsert gamification profile if table available
    try {
      await (supabase.from("merchant_gamification_profile") as any).upsert({
        store_id: storeId,
        user_id: userId,
        xp: totalXp,
        level: levelInfo.level,
        current_streak_days: currentStreakDays,
        longest_streak_days: longestStreakDays,
        last_sale_date: lastSaleDate,
        highest_daily_revenue: highestDailyRevenue,
        highest_daily_orders: highestDailyOrders,
        highest_monthly_revenue: highestMonthlyRevenue,
        highest_monthly_orders: highestMonthlyOrders,
        updated_at: new Date().toISOString(),
      });
    } catch {
      // ignore
    }

    // 8. Fetch stored unlocked achievements
    const unlockedMap: Record<string, string> = {};
    try {
      const { data: unlockedRows } = await (supabase.from("merchant_achievements") as any)
        .select("*")
        .eq("store_id", storeId);

      (unlockedRows || []).forEach((u: any) => {
        unlockedMap[u.achievement_key] = u.unlocked_at;
      });
    } catch {
      // Fallback from activity_logs
      try {
        const { data: altAch } = await (supabase.from("activity_logs") as any)
          .select("*")
          .eq("store_id", storeId)
          .like("action", "growth_quest_achievement_%");
        (altAch || []).forEach((u: any) => {
          const achKey = u.action.replace("growth_quest_achievement_", "");
          unlockedMap[achKey] = u.created_at;
        });
      } catch {}
    }

    const achievements: MerchantAchievementItem[] = ALL_ACHIEVEMENTS.map((a) => ({
      ...a,
      isUnlocked: Boolean(unlockedMap[a.key]),
      unlockedAt: unlockedMap[a.key] || null,
    }));

    // 9. Smart Suggestions based on real historical data
    const suggestedGoals = this.generateSmartSuggestions(totalLifetimeRevenue, totalLifetimeOrders);

    return {
      xp: totalXp,
      levelInfo,
      currentStreakDays,
      longestStreakDays,
      lastSaleDate,
      highestDailyRevenue,
      highestDailyOrders,
      highestMonthlyRevenue,
      highestMonthlyOrders,
      activeGoals: evaluatedGoals.filter((g) => g.status === "active"),
      completedGoals: evaluatedGoals.filter((g) => g.status === "completed" || g.status === "expired"),
      achievements,
      recentXpEvents: (xpLogs || []).slice(0, 10).map((l: any) => ({
        id: l.id,
        source: l.source,
        xpAmount: l.xp_amount,
        description: l.description,
        createdAt: l.created_at,
      })),
      suggestedGoals,
    };
  }

  /**
   * Idempotently awards XP and logs event with dual-layer persistence
   */
  static async awardXp(
    storeId: string,
    userId: string,
    source: string,
    sourceId: string,
    amount: number,
    description: string,
    supabase: any
  ) {
    // 1. Try primary merchant_xp_log table
    try {
      const { error } = await (supabase.from("merchant_xp_log") as any).insert({
        store_id: storeId,
        user_id: userId,
        source,
        source_id: sourceId,
        xp_amount: amount,
        description,
      });
      if (!error) return;
    } catch {}

    // 2. Resilient backup to activity_logs
    try {
      const { data: existing } = await (supabase.from("activity_logs") as any)
        .select("id")
        .eq("store_id", storeId)
        .eq("action", `growth_quest_xp_${source}_${sourceId}`)
        .maybeSingle();

      if (!existing) {
        await (supabase.from("activity_logs") as any).insert({
          store_id: storeId,
          user_id: userId,
          action: `growth_quest_xp_${source}_${sourceId}`,
          details: {
            source,
            source_id: sourceId,
            xp_amount: amount,
            description,
          },
        });
      }
    } catch {}
  }

  /**
   * Evaluates all achievement criteria based on real activity
   */
  private static async evaluateAchievements(
    storeId: string,
    userId: string,
    metrics: {
      totalRevenue: number;
      totalOrders: number;
      longestStreak: number;
      completedGoalsCount: number;
    },
    supabase: any
  ) {
    const toUnlock: AchievementDefinition[] = [];

    // Order Achievements
    if (metrics.totalOrders >= 1) toUnlock.push(ALL_ACHIEVEMENTS.find((a) => a.key === "first_order")!);
    if (metrics.totalOrders >= 10) toUnlock.push(ALL_ACHIEVEMENTS.find((a) => a.key === "orders_10")!);
    if (metrics.totalOrders >= 25) toUnlock.push(ALL_ACHIEVEMENTS.find((a) => a.key === "orders_25")!);
    if (metrics.totalOrders >= 50) toUnlock.push(ALL_ACHIEVEMENTS.find((a) => a.key === "orders_50")!);
    if (metrics.totalOrders >= 100) toUnlock.push(ALL_ACHIEVEMENTS.find((a) => a.key === "orders_100")!);

    // Revenue Achievements
    if (metrics.totalRevenue >= 5000) toUnlock.push(ALL_ACHIEVEMENTS.find((a) => a.key === "revenue_5k")!);
    if (metrics.totalRevenue >= 10000) toUnlock.push(ALL_ACHIEVEMENTS.find((a) => a.key === "revenue_10k")!);
    if (metrics.totalRevenue >= 25000) toUnlock.push(ALL_ACHIEVEMENTS.find((a) => a.key === "revenue_25k")!);
    if (metrics.totalRevenue >= 50000) toUnlock.push(ALL_ACHIEVEMENTS.find((a) => a.key === "revenue_50k")!);
    if (metrics.totalRevenue >= 100000) toUnlock.push(ALL_ACHIEVEMENTS.find((a) => a.key === "revenue_100k")!);

    // Streak Achievements
    if (metrics.longestStreak >= 3) toUnlock.push(ALL_ACHIEVEMENTS.find((a) => a.key === "streak_3")!);
    if (metrics.longestStreak >= 7) toUnlock.push(ALL_ACHIEVEMENTS.find((a) => a.key === "streak_7")!);
    if (metrics.longestStreak >= 14) toUnlock.push(ALL_ACHIEVEMENTS.find((a) => a.key === "streak_14")!);

    // Goal Achievements
    if (metrics.completedGoalsCount >= 1) toUnlock.push(ALL_ACHIEVEMENTS.find((a) => a.key === "goal_completed")!);

    for (const ach of toUnlock.filter(Boolean)) {
      let saved = false;
      try {
        const { error } = await (supabase.from("merchant_achievements") as any).insert({
          store_id: storeId,
          user_id: userId,
          achievement_key: ach.key,
          title: ach.title,
          description: ach.description,
          icon: ach.icon,
          xp_reward: ach.xpReward,
        });

        if (!error) {
          saved = true;
          await this.awardXp(
            storeId,
            userId,
            "achievement",
            ach.key,
            ach.xpReward,
            `Unlocked Achievement: ${ach.title}`,
            supabase
          );
        }
      } catch {}

      if (!saved) {
        // Fallback to activity_logs
        try {
          const { data: existing } = await (supabase.from("activity_logs") as any)
            .select("id")
            .eq("store_id", storeId)
            .eq("action", `growth_quest_achievement_${ach.key}`)
            .maybeSingle();

          if (!existing) {
            await (supabase.from("activity_logs") as any).insert({
              store_id: storeId,
              user_id: userId,
              action: `growth_quest_achievement_${ach.key}`,
              details: {
                title: ach.title,
                description: ach.description,
                icon: ach.icon,
                xp_reward: ach.xpReward,
              },
            });
            await this.awardXp(
              storeId,
              userId,
              "achievement",
              ach.key,
              ach.xpReward,
              `Unlocked Achievement: ${ach.title}`,
              supabase
            );
          }
        } catch {}
      }
    }
  }

  /**
   * Generates tailored goal suggestions based on real store performance
   */
  private static generateSmartSuggestions(
    totalRevenue: number,
    totalOrders: number
  ): Array<{ title: string; goalType: GoalType; targetValue: number; periodType: GoalPeriod; reason: string }> {
    const suggestions = [];

    if (totalOrders === 0) {
      suggestions.push({
        title: "First 10 Customer Orders",
        goalType: "orders_count" as GoalType,
        targetValue: 10,
        periodType: "month" as GoalPeriod,
        reason: "Kickstart your digital catalog with your first 10 orders",
      });
      suggestions.push({
        title: "₹5,000 Monthly Revenue Quest",
        goalType: "revenue" as GoalType,
        targetValue: 5000,
        periodType: "month" as GoalPeriod,
        reason: "Achieve baseline profitability in your first month",
      });
    } else if (totalRevenue < 25000) {
      const nextTarget = Math.ceil((totalRevenue * 1.5) / 5000) * 5000;
      suggestions.push({
        title: `₹${nextTarget.toLocaleString()} Monthly Sales Target`,
        goalType: "revenue" as GoalType,
        targetValue: nextTarget,
        periodType: "month" as GoalPeriod,
        reason: "Next logical revenue milestone based on current growth",
      });
      suggestions.push({
        title: "7-Day Consistent Selling Streak",
        goalType: "selling_streak" as GoalType,
        targetValue: 7,
        periodType: "month" as GoalPeriod,
        reason: "Build repeatable daily sales momentum on WhatsApp and storefront",
      });
    } else {
      suggestions.push({
        title: "₹50,000 Growth Quest",
        goalType: "revenue" as GoalType,
        targetValue: 50000,
        periodType: "month" as GoalPeriod,
        reason: "Scale your storefront to high-volume revenue",
      });
      suggestions.push({
        title: "100 Units Sold Challenge",
        goalType: "units_sold" as GoalType,
        targetValue: 100,
        periodType: "month" as GoalPeriod,
        reason: "Expand product catalog distribution",
      });
    }

    return suggestions;
  }
}
