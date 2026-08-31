"use client";

import React, { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import {
  Target,
  Trophy,
  Flame,
  Sparkles,
  Plus,
  CheckCircle2,
  Lock,
  ArrowRight,
  TrendingUp,
  Award,
  Calendar,
  Zap,
  Clock,
  Trash2,
  Edit2,
  RefreshCw,
  Gift,
  ShieldCheck,
  ChevronRight,
  Loader2,
  X,
  Filter,
  Check,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { createClient } from "@/lib/supabase/client";
import {
  getGrowthQuestDataAction,
  createGoalAction,
  updateGoalAction,
  deleteGoalAction,
  CreateGoalPayload,
} from "@/lib/actions/growth-quest";
import {
  GamificationSummary,
  MerchantGoal,
  GoalType,
  GoalPeriod,
} from "@/lib/services/growth-quest-engine";
import { formatCurrency, cn } from "@/lib/utils";

const GOAL_TEMPLATES: Array<{
  title: string;
  goalType: GoalType;
  targetValue: number;
  periodType: GoalPeriod;
  description: string;
  icon: string;
}> = [
  {
    title: "First 10 Orders",
    goalType: "orders_count",
    targetValue: 10,
    periodType: "month",
    description: "Launch your storefront catalog and process your first 10 orders",
    icon: "📦",
  },
  {
    title: "₹10,000 Monthly Revenue",
    goalType: "revenue",
    targetValue: 10000,
    periodType: "month",
    description: "Build steady daily sales volume reaching ₹10K monthly revenue",
    icon: "💰",
  },
  {
    title: "₹25,000 Growth Quest",
    goalType: "revenue",
    targetValue: 25000,
    periodType: "month",
    description: "Accelerate catalog sales across WhatsApp and direct orders",
    icon: "🚀",
  },
  {
    title: "7-Day Selling Streak",
    goalType: "selling_streak",
    targetValue: 7,
    periodType: "month",
    description: "Generate qualifying sales for 7 consecutive calendar days",
    icon: "🔥",
  },
  {
    title: "50 Units Distributed",
    goalType: "units_sold",
    targetValue: 50,
    periodType: "month",
    description: "Sell 50 product units from your published catalog",
    icon: "✨",
  },
];

export default function GrowthQuestPage() {
  const { activeStore } = useAuth();
  const [data, setData] = useState<GamificationSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"active" | "achievements" | "history">("active");
  const [achievementCategory, setAchievementCategory] = useState<"all" | "orders" | "revenue" | "streaks" | "goals">("all");

  // Create Goal Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createMode, setCreateMode] = useState<"template" | "custom">("template");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formGoalType, setFormGoalType] = useState<GoalType>("revenue");
  const [formTarget, setFormTarget] = useState<string>("10000");
  const [formPeriod, setFormPeriod] = useState<GoalPeriod>("month");
  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");
  const [formMilestone1, setFormMilestone1] = useState<string>("");
  const [formMilestone2, setFormMilestone2] = useState<string>("");
  const [formMilestone3, setFormMilestone3] = useState<string>("");

  // Edit Goal Modal State
  const [editingGoal, setEditingGoal] = useState<MerchantGoal | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editTarget, setEditTarget] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [isEditingSubmitting, setIsEditingSubmitting] = useState(false);

  const loadData = useCallback(async (silent = false) => {
    if (!activeStore?.id) return;
    if (!silent) setIsLoading(true);
    try {
      const res = await getGrowthQuestDataAction(activeStore.id);
      if (res.success && res.data) {
        setData(res.data);
      } else {
        toast.error("Error", res.error || "Failed to load Growth Quest data.");
      }
    } catch (err: any) {
      toast.error("Error", err.message || "Failed to load Growth Quest.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [activeStore?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Realtime subscription for incoming orders to update goals & milestones dynamically
  useEffect(() => {
    if (!activeStore?.id) return;
    const supabase = createClient();

    const channel = supabase
      .channel(`growth-quest-${activeStore.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `store_id=eq.${activeStore.id}`,
        },
        () => {
          loadData(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeStore?.id, loadData]);

  const handleApplyTemplate = (tpl: typeof GOAL_TEMPLATES[0]) => {
    setFormTitle(tpl.title);
    setFormGoalType(tpl.goalType);
    setFormTarget(tpl.targetValue.toString());
    setFormPeriod(tpl.periodType);
    setFormMilestone1((tpl.targetValue * 0.25).toString());
    setFormMilestone2((tpl.targetValue * 0.5).toString());
    setFormMilestone3((tpl.targetValue * 0.75).toString());
    setCreateMode("custom");
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStore?.id) return;
    const targetVal = parseFloat(formTarget);
    if (isNaN(targetVal) || targetVal <= 0) {
      toast.error("Invalid Target", "Please enter a valid positive number for target.");
      return;
    }

    const milestones: number[] = [];
    if (formMilestone1 && !isNaN(parseFloat(formMilestone1))) milestones.push(parseFloat(formMilestone1));
    if (formMilestone2 && !isNaN(parseFloat(formMilestone2))) milestones.push(parseFloat(formMilestone2));
    if (formMilestone3 && !isNaN(parseFloat(formMilestone3))) milestones.push(parseFloat(formMilestone3));
    milestones.push(targetVal);

    setIsSubmitting(true);
    try {
      const payload: CreateGoalPayload = {
        title: formTitle.trim() || `${formGoalType === "revenue" ? "Revenue" : "Sales"} Quest`,
        goalType: formGoalType,
        targetValue: targetVal,
        periodType: formPeriod,
        startDate: formPeriod === "custom" ? formStartDate : undefined,
        endDate: formPeriod === "custom" ? formEndDate : undefined,
        milestones,
      };

      const res = await createGoalAction(activeStore.id, payload);
      if (res.success) {
        toast.success("🎯 Quest Created!", "Your goal is live and tracking real store orders.");
        setIsCreateModalOpen(false);
        setFormTitle("");
        setFormTarget("10000");
        setFormMilestone1("");
        setFormMilestone2("");
        setFormMilestone3("");
        setCreateMode("template");
        loadData(true);
      } else {
        toast.error("Failed", res.error || "Could not create goal.");
      }
    } catch (err: any) {
      toast.error("Error", err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (quest: MerchantGoal) => {
    setEditingGoal(quest);
    setEditTitle(quest.title);
    setEditTarget(quest.targetValue.toString());
    setEditEndDate(quest.endDate.split("T")[0]);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStore?.id || !editingGoal) return;
    const targetVal = parseFloat(editTarget);
    if (isNaN(targetVal) || targetVal <= 0) {
      toast.error("Invalid Target", "Target must be a positive number.");
      return;
    }

    setIsEditingSubmitting(true);
    try {
      const res = await updateGoalAction(activeStore.id, {
        goalId: editingGoal.id,
        title: editTitle.trim(),
        targetValue: targetVal,
        endDate: editEndDate,
      });

      if (res.success) {
        toast.success("Goal Updated", "Your changes have been saved.");
        setEditingGoal(null);
        loadData(true);
      } else {
        toast.error("Error", res.error || "Failed to update goal.");
      }
    } catch (err: any) {
      toast.error("Error", err.message || "Failed to update goal.");
    } finally {
      setIsEditingSubmitting(false);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!activeStore?.id) return;
    if (!confirm("Are you sure you want to remove this quest?")) return;
    try {
      const res = await deleteGoalAction(activeStore.id, goalId);
      if (res.success) {
        toast.success("Quest Removed", "The goal has been deleted.");
        loadData(true);
      } else {
        toast.error("Error", res.error || "Failed to delete quest.");
      }
    } catch (err: any) {
      toast.error("Error", err.message || "Could not delete quest.");
    }
  };

  const formatTarget = (val: number, type: GoalType) => {
    if (type === "revenue" || type === "avg_order_value") {
      return formatCurrency(val);
    }
    if (type === "orders_count") return `${val.toLocaleString()} Orders`;
    if (type === "units_sold") return `${val.toLocaleString()} Units`;
    if (type === "selling_streak") return `${val} Days Streak`;
    return val.toLocaleString();
  };

  const activeQuests = data?.activeGoals || [];
  const completedQuests = data?.completedGoals || [];
  const primaryQuest: MerchantGoal | undefined = activeQuests[0];

  const filteredAchievements = (data?.achievements || []).filter((ach) => {
    if (achievementCategory === "all") return true;
    return ach.category === achievementCategory;
  });

  return (
    <DashboardLayout breadcrumbs={[{ label: "Overview", href: "/dashboard" }, { label: "Growth Quest" }]}>
      <div className="space-y-8 text-left max-w-7xl mx-auto">
        {/* 1. Header with Level Badge & Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-maroon-900/40 border border-maroon-600/40 flex items-center justify-center text-maroon-400">
                <Target className="w-5 h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold font-heading text-white">Growth Quest</h1>
              <Badge variant="maroon" className="text-xs uppercase tracking-wider font-bold">
                Level {data?.levelInfo.level || 1} • {data?.levelInfo.title || "Getting Started"}
              </Badge>
            </div>
            <p className="text-xs text-zinc-400 font-body mt-1">
              Gamified sales milestones derived strictly from real customer orders in Supabase.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsRefreshing(true);
                loadData(true);
              }}
              disabled={isRefreshing}
              className="text-xs border-white/10"
              leftIcon={<RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin")} />}
            >
              Sync Orders
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCreateModalOpen(true)}
              className="text-xs font-semibold shadow-glow"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Start New Quest
            </Button>
          </div>
        </div>

        {/* 2. Top Gamer Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Level & XP Card */}
          <Card className="p-5 bg-[#151515] border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 font-heading">
                Merchant Level
              </span>
              <span className="text-lg">{data?.levelInfo.badge || "🌱"}</span>
            </div>
            <div>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-bold font-heading text-white">
                  Level {data?.levelInfo.level || 1}
                </span>
                <span className="text-xs font-mono text-amber-400 font-semibold">
                  {(data?.xp || 0).toLocaleString()} XP
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-body">{data?.levelInfo.title || "Getting Started"}</p>
            </div>
            <div className="space-y-1">
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-500"
                  style={{ width: `${data?.levelInfo.progressPercent || 0}%` }}
                />
              </div>
              <span className="text-[9px] font-mono text-zinc-500 block text-right">
                {data?.levelInfo.progressPercent || 0}% to Level {(data?.levelInfo.level || 1) + 1}
              </span>
            </div>
          </Card>

          {/* Selling Streak Card */}
          <Card className="p-5 bg-[#151515] border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 font-heading">
                Selling Streak
              </span>
              <Flame className="w-4 h-4 text-orange-500" />
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold font-mono text-orange-400">
                  {data?.currentStreakDays || 0}
                </span>
                <span className="text-xs text-zinc-400">Consecutive Days</span>
              </div>
              <p className="text-[11px] text-zinc-500 font-body mt-0.5">
                Best streak: <strong className="text-white">{data?.longestStreakDays || 0} days</strong>
              </p>
            </div>
            <div className="text-[10px] font-mono text-zinc-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-zinc-500" />
              <span>{data?.lastSaleDate ? `Last sale: ${data.lastSaleDate}` : "No sales recorded yet"}</span>
            </div>
          </Card>

          {/* Highest Single Day Record */}
          <Card className="p-5 bg-[#151515] border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 font-heading">
                Peak Single Day
              </span>
              <Zap className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <span className="text-xl font-bold font-mono text-emerald-400 block">
                {formatCurrency(data?.highestDailyRevenue || 0)}
              </span>
              <p className="text-[11px] text-zinc-400 font-body mt-0.5">
                {data?.highestDailyOrders || 0} orders in 24 hours
              </p>
            </div>
            <span className="text-[10px] font-mono text-zinc-500 block">Historical Daily Best</span>
          </Card>

          {/* Achievements Unlocked */}
          <Card className="p-5 bg-[#151515] border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 font-heading">
                Achievements
              </span>
              <Award className="w-4 h-4 text-maroon-400" />
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold font-mono text-white">
                  {data?.achievements.filter((a) => a.isUnlocked).length || 0}
                </span>
                <span className="text-xs text-zinc-400">/ {data?.achievements.length || 15}</span>
              </div>
              <p className="text-[11px] text-zinc-400 font-body mt-0.5">Badges unlocked from real sales</p>
            </div>
            <button
              onClick={() => setActiveTab("achievements")}
              className="text-[10px] text-maroon-400 hover:text-maroon-300 font-semibold flex items-center gap-1 cursor-pointer"
            >
              View Badge Showcase <ArrowRight className="w-3 h-3" />
            </button>
          </Card>
        </div>

        {/* 3. Primary Hero Quest Banner (If Active Quest Exists) */}
        {primaryQuest && (
          <Card className="relative overflow-hidden bg-gradient-to-r from-[#1c0e14] via-[#151115] to-[#111111] border-maroon-800/60 ring-1 ring-maroon-500/20 p-6 sm:p-8 rounded-3xl shadow-glow space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-maroon-900/60 border border-maroon-600/40 text-maroon-300">
                    Active Main Quest
                  </span>
                  <span className="text-xs font-mono text-zinc-400">
                    {primaryQuest.daysRemaining} days remaining
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold font-heading text-white tracking-tight">
                  {primaryQuest.title}
                </h2>
                <p className="text-xs sm:text-sm text-zinc-300 font-body">
                  Target: <strong>{formatTarget(primaryQuest.targetValue, primaryQuest.goalType)}</strong> by{" "}
                  {new Date(primaryQuest.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </div>

              {/* Progress Summary Big Numbers */}
              <div className="p-4 sm:p-5 rounded-2xl bg-black/40 border border-white/10 text-right min-w-[200px] space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 font-heading block">
                  Current Progress
                </span>
                <span className="text-2xl sm:text-3xl font-bold font-mono text-white block">
                  {formatTarget(primaryQuest.currentValue, primaryQuest.goalType)}
                </span>
                <div className="flex items-center justify-end gap-2 text-xs font-mono">
                  <span className="text-emerald-400 font-bold">{primaryQuest.progressPercent}%</span>
                  <span className="text-zinc-500">•</span>
                  <span className="text-zinc-400">
                    {primaryQuest.remainingValue > 0
                      ? `${formatTarget(primaryQuest.remainingValue, primaryQuest.goalType)} left`
                      : "🎉 Goal Reached!"}
                  </span>
                </div>
              </div>
            </div>

            {/* Giant Progress Bar with Milestone Checkpoints */}
            <div className="space-y-3 pt-2">
              <div className="relative w-full h-4 bg-white/10 rounded-full overflow-hidden p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-maroon-700 via-maroon-500 to-amber-400 rounded-full transition-all duration-700 shadow-glow"
                  style={{ width: `${Math.min(primaryQuest.progressPercent, 100)}%` }}
                />
              </div>

              {/* Milestone Checkpoint Markers */}
              {primaryQuest.milestones.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                  {primaryQuest.milestones.map((m) => (
                    <div
                      key={m.id}
                      className={cn(
                        "p-2.5 rounded-xl border text-left transition-all",
                        m.isReached
                          ? "bg-emerald-950/30 border-emerald-700/40 text-emerald-300"
                          : "bg-white/5 border-white/5 text-zinc-400"
                      )}
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                        <span className="font-bold">{m.label}</span>
                        {m.isReached ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Lock className="w-3 h-3 text-zinc-600" />
                        )}
                      </div>
                      <span className="text-xs font-bold text-white font-mono block">
                        {formatTarget(m.targetValue, primaryQuest.goalType)}
                      </span>
                      <span className="text-[9px] text-amber-400/80 font-mono block mt-0.5">
                        +{m.xpReward} XP {m.isReached && "✓"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        )}

        {/* 4. Tab Navigation Strip */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <button
            onClick={() => setActiveTab("active")}
            className={cn(
              "px-4 py-2 text-xs font-bold font-heading rounded-xl transition-all cursor-pointer",
              activeTab === "active"
                ? "bg-maroon-800 text-white shadow-sm"
                : "text-zinc-400 hover:text-white"
            )}
          >
            Active Quests ({activeQuests.length})
          </button>
          <button
            onClick={() => setActiveTab("achievements")}
            className={cn(
              "px-4 py-2 text-xs font-bold font-heading rounded-xl transition-all cursor-pointer",
              activeTab === "achievements"
                ? "bg-maroon-800 text-white shadow-sm"
                : "text-zinc-400 hover:text-white"
            )}
          >
            Achievements Showcase ({data?.achievements.filter((a) => a.isUnlocked).length || 0})
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={cn(
              "px-4 py-2 text-xs font-bold font-heading rounded-xl transition-all cursor-pointer",
              activeTab === "history"
                ? "bg-maroon-800 text-white shadow-sm"
                : "text-zinc-400 hover:text-white"
            )}
          >
            Quest History ({completedQuests.length})
          </button>
        </div>

        {/* Tab 1: Active Quests List */}
        {activeTab === "active" && (
          <div className="space-y-6">
            {activeQuests.length === 0 ? (
              <Card className="p-12 text-center bg-[#151515] border-white/10 space-y-4 rounded-3xl">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-maroon-400 mx-auto">
                  <Target className="w-6 h-6" />
                </div>
                <div className="space-y-1 max-w-md mx-auto">
                  <h3 className="text-base font-bold font-heading text-white">No active goals currently</h3>
                  <p className="text-xs text-zinc-400">
                    Your Growth Quest starts with your first target. Choose a quick-start template or set a custom revenue goal.
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="shadow-glow"
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Choose a Growth Quest Template
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activeQuests.map((quest) => (
                  <Card key={quest.id} className="p-6 bg-[#151515] border-white/10 space-y-5 rounded-2xl">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-maroon-400 font-heading">
                            {quest.goalType.replace("_", " ")}
                          </span>
                          <span className="text-[10px] font-mono text-zinc-500">
                            • {quest.daysRemaining} days left
                          </span>
                        </div>
                        <h3 className="text-base font-bold font-heading text-white">{quest.title}</h3>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(quest)}
                          className="text-zinc-500 hover:text-white p-1.5 transition-colors"
                          title="Edit Goal"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteGoal(quest.id)}
                          className="text-zinc-600 hover:text-red-400 p-1.5 transition-colors"
                          title="Delete Goal"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-baseline justify-between text-xs">
                        <span className="font-bold text-white font-mono">
                          {formatTarget(quest.currentValue, quest.goalType)} / {formatTarget(quest.targetValue, quest.goalType)}
                        </span>
                        <span className="font-bold text-emerald-400 font-mono">{quest.progressPercent}%</span>
                      </div>
                      <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-maroon-700 to-maroon-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(quest.progressPercent, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Milestones Checklist */}
                    {quest.milestones.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-white/5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-heading block">
                          Milestone Checkpoints
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                          {quest.milestones.map((m) => (
                            <div
                              key={m.id}
                              className={cn(
                                "p-2 rounded-lg border text-[11px] font-mono flex items-center justify-between",
                                m.isReached
                                  ? "bg-emerald-950/20 border-emerald-800/30 text-emerald-300 font-semibold"
                                  : "bg-white/[0.02] border-white/5 text-zinc-500"
                              )}
                            >
                              <span>{formatTarget(m.targetValue, quest.goalType)}</span>
                              {m.isReached ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              ) : (
                                <span className="text-[9px] text-zinc-600">+{m.xpReward} XP</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}

            {/* Smart Suggestions Bar */}
            {data?.suggestedGoals && data.suggestedGoals.length > 0 && (
              <div className="p-6 rounded-3xl bg-[#111111] border border-white/10 space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold font-heading text-white">Smart Quest Suggestions</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {data.suggestedGoals.map((sug, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between gap-4"
                    >
                      <div className="space-y-1 text-left">
                        <h4 className="text-xs font-bold text-white">{sug.title}</h4>
                        <p className="text-[10px] text-zinc-400">{sug.reason}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setFormTitle(sug.title);
                          setFormGoalType(sug.goalType);
                          setFormTarget(sug.targetValue.toString());
                          setFormPeriod(sug.periodType);
                          setCreateMode("custom");
                          setIsCreateModalOpen(true);
                        }}
                        className="text-xs shrink-0 border-white/10"
                      >
                        Adopt
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Achievements Showcase */}
        {activeTab === "achievements" && (
          <div className="space-y-6">
            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-2">
              {(["all", "orders", "revenue", "streaks", "goals"] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setAchievementCategory(cat)}
                  className={cn(
                    "px-3 py-1.5 text-xs rounded-lg font-medium transition-colors capitalize",
                    achievementCategory === cat
                      ? "bg-maroon-800 text-white font-bold"
                      : "bg-white/5 text-zinc-400 hover:text-white"
                  )}
                >
                  {cat === "all" ? "All Badges" : cat}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAchievements.map((ach) => (
                <Card
                  key={ach.key}
                  className={cn(
                    "p-5 rounded-2xl border transition-all text-left space-y-3",
                    ach.isUnlocked
                      ? "bg-[#181818] border-amber-500/30 shadow-card"
                      : "bg-[#111111] border-white/5 opacity-60"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xl">
                      {ach.icon}
                    </div>
                    <span className="text-[10px] font-mono font-bold text-amber-400">
                      +{ach.xpReward} XP
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold font-heading text-white">{ach.title}</h3>
                      {ach.isUnlocked ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <Lock className="w-3 h-3 text-zinc-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">{ach.description}</p>
                  </div>

                  {ach.isUnlocked && ach.unlockedAt && (
                    <span className="text-[9px] font-mono text-zinc-500 block pt-1 border-t border-white/5">
                      Unlocked: {new Date(ach.unlockedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Quest History */}
        {activeTab === "history" && (
          <div className="space-y-4">
            {completedQuests.length === 0 ? (
              <Card className="p-12 text-center bg-[#151515] border-white/10 text-zinc-500 text-xs">
                No past quests in archive yet. Completed or expired goals will archive here.
              </Card>
            ) : (
              <div className="space-y-3">
                {completedQuests.map((quest) => (
                  <Card key={quest.id} className="p-5 bg-[#151515] border-white/10 flex items-center justify-between gap-4 rounded-2xl">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={quest.status === "completed" ? "maroon" : "outline"} className="text-[10px]">
                          {quest.status === "completed" ? "Completed ✓" : "Expired"}
                        </Badge>
                        <h4 className="text-sm font-bold font-heading text-white">{quest.title}</h4>
                      </div>
                      <p className="text-xs font-mono text-zinc-400">
                        {formatTarget(quest.currentValue, quest.goalType)} / {formatTarget(quest.targetValue, quest.goalType)} ({quest.progressPercent}%)
                      </p>
                    </div>
                    <span className="text-xs font-mono text-zinc-500">
                      {new Date(quest.endDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                    </span>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5. Create Goal Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#151515] border border-white/10 rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl text-left max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <h3 className="text-lg font-bold font-heading text-white">Launch Growth Quest</h3>
                <p className="text-xs text-zinc-400">Set a measurable target for real storefront orders.</p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-zinc-500 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Template Selector vs Custom Switcher */}
            <div className="flex items-center gap-2 bg-[#111111] p-1 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => setCreateMode("template")}
                className={cn(
                  "flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all",
                  createMode === "template" ? "bg-maroon-800 text-white font-bold" : "text-zinc-400"
                )}
              >
                Quick Templates
              </button>
              <button
                type="button"
                onClick={() => setCreateMode("custom")}
                className={cn(
                  "flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all",
                  createMode === "custom" ? "bg-maroon-800 text-white font-bold" : "text-zinc-400"
                )}
              >
                Custom Quest
              </button>
            </div>

            {createMode === "template" ? (
              <div className="space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 font-heading block">
                  Select a Proven Template
                </span>
                <div className="grid grid-cols-1 gap-3">
                  {GOAL_TEMPLATES.map((tpl, i) => (
                    <div
                      key={i}
                      onClick={() => handleApplyTemplate(tpl)}
                      className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-maroon-700/50 transition-all cursor-pointer flex items-center justify-between gap-4 group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{tpl.icon}</span>
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-bold text-white group-hover:text-maroon-300 transition-colors">
                            {tpl.title}
                          </h4>
                          <p className="text-[11px] text-zinc-400">{tpl.description}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-white transition-colors" />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateGoal} className="space-y-4">
                <Input
                  label="Quest Title"
                  placeholder="e.g. September Revenue Sprint"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold font-heading text-zinc-400">Metric Type</label>
                    <select
                      value={formGoalType}
                      onChange={(e) => setFormGoalType(e.target.value as GoalType)}
                      className="w-full h-10 bg-[#111111] border border-white/10 rounded-xl px-3 text-xs text-white outline-none focus:border-maroon-600"
                    >
                      <option value="revenue">Total Revenue (₹)</option>
                      <option value="orders_count">Order Count</option>
                      <option value="units_sold">Product Units Sold</option>
                      <option value="avg_order_value">Average Order Value (₹)</option>
                      <option value="selling_streak">Selling Streak (Days)</option>
                    </select>
                  </div>

                  <Input
                    label="Target Number"
                    type="number"
                    value={formTarget}
                    onChange={(e) => setFormTarget(e.target.value)}
                    placeholder="10000"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold font-heading text-zinc-400">Goal Timeframe</label>
                  <select
                    value={formPeriod}
                    onChange={(e) => setFormPeriod(e.target.value as GoalPeriod)}
                    className="w-full h-10 bg-[#111111] border border-white/10 rounded-xl px-3 text-xs text-white outline-none focus:border-maroon-600"
                  >
                    <option value="month">This Month (Current Calendar Month)</option>
                    <option value="3_months">3 Months Quarter</option>
                    <option value="6_months">6 Months</option>
                    <option value="year">Full Year</option>
                    <option value="custom">Custom Date Range</option>
                  </select>
                </div>

                {formPeriod === "custom" && (
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <Input
                      label="Start Date"
                      type="date"
                      value={formStartDate}
                      onChange={(e) => setFormStartDate(e.target.value)}
                      required
                    />
                    <Input
                      label="End Date"
                      type="date"
                      value={formEndDate}
                      onChange={(e) => setFormEndDate(e.target.value)}
                      required
                    />
                  </div>
                )}

                {/* Optional Milestones */}
                <div className="space-y-2 pt-2 border-t border-white/5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 font-heading block">
                    Custom Milestones (Optional)
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      placeholder="25% (2500)"
                      type="number"
                      value={formMilestone1}
                      onChange={(e) => setFormMilestone1(e.target.value)}
                    />
                    <Input
                      placeholder="50% (5000)"
                      type="number"
                      value={formMilestone2}
                      onChange={(e) => setFormMilestone2(e.target.value)}
                    />
                    <Input
                      placeholder="75% (7500)"
                      type="number"
                      value={formMilestone3}
                      onChange={(e) => setFormMilestone3(e.target.value)}
                    />
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/10">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="text-xs border-white/10"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isSubmitting}
                    className="text-xs font-semibold shadow-glow"
                    leftIcon={isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Target className="w-3.5 h-3.5" />}
                  >
                    {isSubmitting ? "Launching..." : "Launch Quest"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 6. Edit Goal Modal */}
      {editingGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#151515] border border-white/10 rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl text-left">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <h3 className="text-lg font-bold font-heading text-white">Edit Goal</h3>
                <p className="text-xs text-zinc-400">Update quest target, title, or end date.</p>
              </div>
              <button onClick={() => setEditingGoal(null)} className="text-zinc-500 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <Input
                label="Goal Title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                required
              />

              <Input
                label="Target Number"
                type="number"
                value={editTarget}
                onChange={(e) => setEditTarget(e.target.value)}
                required
              />

              <Input
                label="End Date"
                type="date"
                value={editEndDate}
                onChange={(e) => setEditEndDate(e.target.value)}
                required
              />

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/10">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingGoal(null)}
                  className="text-xs border-white/10"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isEditingSubmitting}
                  className="text-xs font-semibold shadow-glow"
                  leftIcon={isEditingSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                >
                  {isEditingSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
