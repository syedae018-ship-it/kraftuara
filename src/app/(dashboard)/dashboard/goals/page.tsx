"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import {
  Target,
  Sparkles,
  Plus,
  CheckCircle2,
  TrendingUp,
  Zap,
  Trash2,
  Edit2,
  RefreshCw,
  Gift,
  ChevronRight,
  Loader2,
  X,
  Layers,
  ArrowRight,
  Package,
  ShoppingBag,
  History,
  Info,
  Award,
  Calendar,
  BarChart3,
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
  createMerchantQuestAction,
  updateMerchantQuestAction,
  pauseOrArchiveQuestAction,
  joinCraftauraQuestAction,
} from "@/lib/actions/growth-quest";
import {
  GrowthQuestOverview,
  MerchantQuest,
  QuestTemplate,
  QuestDifficulty,
} from "@/lib/services/growth-quest-service";
import { formatCurrency, cn } from "@/lib/utils";

export default function GrowthQuestPage() {
  const { activeStore } = useAuth();
  const [data, setData] = useState<GrowthQuestOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"quest" | "history">("quest");

  // Template Selection Modal
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  // Create / Edit Quest Form Modal
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create_custom" | "create_from_template" | "edit">("create_custom");
  const [selectedTemplate, setSelectedTemplate] = useState<QuestTemplate | null>(null);

  // Form Fields
  const [formQuestName, setFormQuestName] = useState("");
  const [formRevenueTarget, setFormRevenueTarget] = useState("");
  const [formOrdersTarget, setFormOrdersTarget] = useState("");
  const [formProductsTarget, setFormProductsTarget] = useState("");
  const [formDifficulty, setFormDifficulty] = useState<QuestDifficulty>("custom");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Points Ledger Modal
  const [isPointsModalOpen, setIsPointsModalOpen] = useState(false);

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
      toast.error("Error", err.message || "Failed to load Growth Quest data.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [activeStore?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Realtime subscription for automatic updates on orders and quests
  useEffect(() => {
    if (!activeStore?.id) return;
    const supabase = createClient();

    const channel = supabase
      .channel(`growth-quest-store-${activeStore.id}`)
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
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "growth_quests",
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

  // Handle open custom creator
  const handleOpenCustomCreate = () => {
    const currentMonth = new Date().toLocaleString("default", { month: "long" });
    setFormMode("create_custom");
    setSelectedTemplate(null);
    setFormDifficulty("custom");
    setFormQuestName(`${currentMonth} Growth Quest`);
    setFormRevenueTarget("10000");
    setFormOrdersTarget("15");
    setFormProductsTarget("20");
    setIsTemplateModalOpen(false);
    setIsFormModalOpen(true);
  };

  // Handle open template picker
  const handleOpenTemplatePicker = () => {
    setIsTemplateModalOpen(true);
  };

  // When merchant selects a template
  const handleSelectTemplate = (tpl: QuestTemplate) => {
    const currentMonth = new Date().toLocaleString("default", { month: "long" });
    setFormMode("create_from_template");
    setSelectedTemplate(tpl);
    setFormDifficulty(tpl.difficulty);
    setFormQuestName(`${currentMonth} - ${tpl.name}`);
    setFormRevenueTarget(tpl.revenueTarget > 0 ? tpl.revenueTarget.toString() : "");
    setFormOrdersTarget(tpl.ordersTarget > 0 ? tpl.ordersTarget.toString() : "");
    setFormProductsTarget(tpl.productsTarget > 0 ? tpl.productsTarget.toString() : "");
    setIsTemplateModalOpen(false);
    setIsFormModalOpen(true);
  };

  // Open edit modal for active quest
  const handleOpenEdit = (quest: MerchantQuest) => {
    setFormMode("edit");
    setSelectedTemplate(null);
    setFormDifficulty(quest.difficulty);
    setFormQuestName(quest.questName);
    setFormRevenueTarget(quest.revenueTarget > 0 ? quest.revenueTarget.toString() : "");
    setFormOrdersTarget(quest.ordersTarget > 0 ? quest.ordersTarget.toString() : "");
    setFormProductsTarget(quest.productsTarget > 0 ? quest.productsTarget.toString() : "");
    setIsFormModalOpen(true);
  };

  // Submit create or edit form
  const handleSaveQuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStore?.id) return;

    if (!formQuestName.trim()) {
      toast.error("Validation Error", "Please provide a quest name.");
      return;
    }

    const rev = parseFloat(formRevenueTarget) || 0;
    const ord = parseInt(formOrdersTarget, 10) || 0;
    const prod = parseInt(formProductsTarget, 10) || 0;

    if (rev <= 0 && ord <= 0 && prod <= 0) {
      toast.error("Validation Error", "Please specify at least one target (Revenue, Orders, or Products Sold).");
      return;
    }

    setIsSubmitting(true);
    try {
      if (formMode === "edit" && data?.activeQuest) {
        const res = await updateMerchantQuestAction({
          questId: data.activeQuest.id,
          storeId: activeStore.id,
          questName: formQuestName,
          revenueTarget: rev,
          ordersTarget: ord,
          productsTarget: prod,
        });

        if (res.success) {
          toast.success("Quest Updated", "Your monthly quest targets have been saved.");
          setIsFormModalOpen(false);
          await loadData(true);
        } else {
          toast.error("Update Failed", res.error || "Failed to update quest.");
        }
      } else {
        const res = await createMerchantQuestAction({
          storeId: activeStore.id,
          questName: formQuestName,
          sourceType: formMode === "create_from_template" ? "template" : "custom",
          templateId: selectedTemplate?.id,
          difficulty: formDifficulty,
          revenueTarget: rev,
          ordersTarget: ord,
          productsTarget: prod,
        });

        if (res.success) {
          toast.success("Quest Activated!", "Your new monthly Growth Quest is now active and tracking.");
          setIsFormModalOpen(false);
          await loadData(true);
        } else {
          toast.error("Creation Failed", res.error || "Failed to create quest.");
        }
      }
    } catch (err: any) {
      toast.error("Error", err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Pause / Archive Quest
  const handleArchiveQuest = async (questId: string) => {
    if (!activeStore?.id) return;
    if (!confirm("Are you sure you want to end this quest? Your points will be preserved in your history.")) return;

    try {
      const res = await pauseOrArchiveQuestAction(questId, activeStore.id, "archived");
      if (res.success) {
        toast.success("Quest Archived", "Your quest has been safely archived.");
        await loadData(true);
      } else {
        toast.error("Error", res.error || "Failed to archive quest.");
      }
    } catch (err: any) {
      toast.error("Error", err.message || "Failed to archive quest.");
    }
  };

  // Join Craftaura Platform Quest
  const handleJoinCraftauraQuest = async (questId: string) => {
    if (!activeStore?.id) return;
    try {
      const res = await joinCraftauraQuestAction(questId, activeStore.id);
      if (res.success) {
        toast.success("Challenge Joined! 🎯", "You are now participating in this month's Craftaura Quest.");
        await loadData(true);
      } else {
        toast.error("Error", res.error || "Failed to join challenge.");
      }
    } catch (err: any) {
      toast.error("Error", err.message || "Failed to join challenge.");
    }
  };

  // Chart metrics computation
  const chartPoints = useMemo(() => {
    return data?.dailyProgress || [];
  }, [data?.dailyProgress]);

  const maxRevenue = useMemo(() => {
    const target = data?.activeQuest?.revenueTarget || 10000;
    const maxProg = chartPoints.length > 0 ? Math.max(...chartPoints.map((p) => p.cumulativeRevenue)) : 0;
    return Math.max(target, maxProg, 1000);
  }, [chartPoints, data?.activeQuest?.revenueTarget]);

  if (isLoading) {
    return (
      <DashboardLayout breadcrumbs={[{ label: "Overview", href: "/dashboard" }, { label: "Growth Quest" }]}>
        <div className="space-y-6 max-w-5xl mx-auto pb-12">
          <div className="flex justify-between items-center">
            <Skeleton className="h-10 w-48 bg-white/5" />
            <Skeleton className="h-10 w-32 bg-white/5" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-64 rounded-3xl bg-white/5" />
            <Skeleton className="h-64 rounded-3xl bg-white/5" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const activeQuest = data?.activeQuest;
  const progress = data?.progress;
  const craftauraQuest = data?.craftauraQuest;
  const templates = data?.templates || [];
  const totalPoints = data?.totalPoints || 0;
  const pointsBreakdown = data?.pointsBreakdown || {
    ordersPoints: 0,
    revenuePoints: 0,
    productsPoints: 0,
    milestonesPoints: 0,
    craftauraPoints: 0,
    totalPoints: 0,
  };
  const currentMonthName = data?.currentMonthName || "This Month";

  return (
    <DashboardLayout breadcrumbs={[{ label: "Overview", href: "/dashboard" }, { label: "Growth Quest" }]}>
      <div className="space-y-8 max-w-5xl mx-auto pb-16 font-body text-zinc-100">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-sm">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold font-heading text-white tracking-tight">Growth Quest</h1>
                <p className="text-xs text-zinc-400">Simple, motivating monthly business targets for your store</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* My Quest Points Badge */}
            <button
              onClick={() => setIsPointsModalOpen(true)}
              className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 transition-all cursor-pointer shadow-sm group"
            >
              <Sparkles className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform" />
              <div className="text-left">
                <span className="text-[10px] uppercase tracking-wider text-amber-400/80 block font-semibold leading-none">
                  My Quest Points
                </span>
                <span className="text-sm font-bold font-heading text-white">{totalPoints.toLocaleString()}</span>
              </div>
            </button>

            {/* Sync Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsRefreshing(true);
                loadData(true);
              }}
              disabled={isRefreshing}
              className="border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 h-9 rounded-xl"
            >
              <RefreshCw className={cn("w-3.5 h-3.5 mr-1.5", isRefreshing && "animate-spin text-amber-400")} />
              Sync
            </Button>
          </div>
        </div>

        {/* Navigation Tabs (Strictly Private - No Leaderboard) */}
        <div className="flex gap-2 border-b border-white/10 pb-2">
          <button
            onClick={() => setActiveTab("quest")}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2",
              activeTab === "quest"
                ? "bg-maroon-700/80 text-white border border-maroon-600/50 shadow-md"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            )}
          >
            <Target className="w-4 h-4" />
            My Active Quest
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2",
              activeTab === "history"
                ? "bg-maroon-700/80 text-white border border-maroon-600/50 shadow-md"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            )}
          >
            <History className="w-4 h-4 text-zinc-400" />
            My Quest History
          </button>
        </div>

        {/* ----------------- TAB 1: MY ACTIVE QUEST ----------------- */}
        {activeTab === "quest" && (
          <div className="space-y-8">
            
            {/* IF NO ACTIVE QUEST: SHOW 2 PRIMARY ENTRY CARDS */}
            {!activeQuest ? (
              <div className="space-y-6 pt-4">
                <div className="text-center max-w-md mx-auto space-y-2">
                  <h2 className="text-xl font-bold font-heading text-white">Start Your Quest for {currentMonthName}</h2>
                  <p className="text-sm text-zinc-400">
                    Set a practical sales target to keep your store focused and earn Quest Points.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto pt-2">
                  
                  {/* CARD 1: CREATE YOUR OWN QUEST */}
                  <Card
                    onClick={handleOpenCustomCreate}
                    className="relative overflow-hidden bg-gradient-to-br from-zinc-900/90 via-zinc-900 to-zinc-950 border border-white/10 hover:border-amber-500/50 p-6 rounded-3xl cursor-pointer group transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                  >
                    <div className="space-y-4">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                        <Plus className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold font-heading text-white group-hover:text-amber-300 transition-colors">
                          Create Your Own Quest
                        </h3>
                        <p className="text-sm text-zinc-400 mt-1">
                          Define your custom Revenue, Orders, and Products sold targets.
                        </p>
                      </div>
                      <div className="pt-2 flex items-center text-xs font-semibold text-amber-400 gap-1 group-hover:translate-x-1 transition-transform">
                        <span>Set Custom Target</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </Card>

                  {/* CARD 2: USE A TEMPLATE */}
                  <Card
                    onClick={handleOpenTemplatePicker}
                    className="relative overflow-hidden bg-gradient-to-br from-zinc-900/90 via-zinc-900 to-zinc-950 border border-white/10 hover:border-maroon-500/50 p-6 rounded-3xl cursor-pointer group transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                  >
                    <div className="space-y-4">
                      <div className="w-12 h-12 rounded-2xl bg-maroon-500/10 border border-maroon-500/30 flex items-center justify-center text-maroon-400 group-hover:scale-110 transition-transform">
                        <Layers className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold font-heading text-white group-hover:text-maroon-300 transition-colors">
                          Use a Template
                        </h3>
                        <p className="text-sm text-zinc-400 mt-1">
                          Choose from Easy, Moderate, or Difficult starter targets.
                        </p>
                      </div>
                      <div className="pt-2 flex items-center text-xs font-semibold text-maroon-400 gap-1 group-hover:translate-x-1 transition-transform">
                        <span>Browse 3 Difficulty Levels</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            ) : (
              /* ACTIVE QUEST DASHBOARD */
              <div className="space-y-6">
                
                {/* 1. PRIMARY PROGRESS CARD */}
                <Card className="relative overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-900/95 to-black border border-white/10 p-6 sm:p-8 rounded-3xl shadow-xl">
                  <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

                  <div className="relative space-y-6">
                    
                    {/* Header line */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs uppercase tracking-widest text-amber-400 font-semibold font-mono">
                            {currentMonthName} Growth Quest
                          </span>
                          {activeQuest.difficulty && (
                            <Badge variant="outline" className="text-[10px] capitalize border-white/20 text-zinc-300">
                              {activeQuest.difficulty}
                            </Badge>
                          )}
                          {progress?.isComplete && (
                            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px]">
                              🎉 100% Completed
                            </Badge>
                          )}
                        </div>
                        <h2 className="text-2xl font-bold font-heading text-white">{activeQuest.questName}</h2>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEdit(activeQuest)}
                          className="border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 h-8 text-xs rounded-lg"
                        >
                          <Edit2 className="w-3.5 h-3.5 mr-1" />
                          Edit Quest
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleArchiveQuest(activeQuest.id)}
                          className="text-zinc-500 hover:text-red-400 hover:bg-red-500/10 h-8 text-xs rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Big Numbers & Main Progress Bar */}
                    {activeQuest.revenueTarget > 0 ? (
                      <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                          <div className="flex items-baseline gap-2">
                            <span className="text-3xl sm:text-4xl font-extrabold font-heading text-white">
                              {formatCurrency(progress?.currentRevenue || 0)}
                            </span>
                            <span className="text-sm text-zinc-400 font-medium">
                              of {formatCurrency(activeQuest.revenueTarget)}
                            </span>
                          </div>
                          <div className="text-sm font-semibold text-amber-400 font-mono">
                            {progress?.revenueRemaining === 0
                              ? "Target Reached! 🚀"
                              : `${formatCurrency(progress?.revenueRemaining || 0)} remaining`}
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-zinc-800/80 rounded-full h-4 p-0.5 border border-white/5 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-400 h-full rounded-full transition-all duration-700 ease-out shadow-sm"
                            style={{ width: `${progress?.revenueProgressPercent || 0}%` }}
                          />
                        </div>

                        <div className="flex justify-between items-center text-xs text-zinc-400 font-mono">
                          <span>{progress?.revenueProgressPercent || 0}% achieved</span>
                          <span>Target: {formatCurrency(activeQuest.revenueTarget)}</span>
                        </div>
                      </div>
                    ) : (
                      /* Orders target primary view */
                      <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                          <div className="flex items-baseline gap-2">
                            <span className="text-3xl sm:text-4xl font-extrabold font-heading text-white">
                              {progress?.currentOrders || 0} Orders
                            </span>
                            <span className="text-sm text-zinc-400 font-medium">
                              of {activeQuest.ordersTarget} Target
                            </span>
                          </div>
                          <div className="text-sm font-semibold text-amber-400 font-mono">
                            {progress?.ordersRemaining === 0 ? "Target Reached! 🚀" : `${progress?.ordersRemaining} orders remaining`}
                          </div>
                        </div>

                        <div className="w-full bg-zinc-800/80 rounded-full h-4 p-0.5 border border-white/5 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-400 h-full rounded-full transition-all duration-700 ease-out"
                            style={{ width: `${progress?.ordersProgressPercent || 0}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* 2. YOUR TARGETS BREAKDOWN CARDS */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      
                      {/* Revenue Target Card */}
                      {activeQuest.revenueTarget > 0 && (
                        <div className="p-4 rounded-2xl bg-zinc-800/40 border border-white/5 space-y-1">
                          <div className="flex items-center justify-between text-xs text-zinc-400">
                            <span className="flex items-center gap-1.5">
                              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                              Revenue
                            </span>
                            <span className="font-mono text-emerald-400">{progress?.revenueProgressPercent || 0}%</span>
                          </div>
                          <div className="text-base font-bold text-white font-heading">
                            {formatCurrency(progress?.currentRevenue || 0)}
                          </div>
                          <div className="text-[11px] text-zinc-500">
                            Goal: {formatCurrency(activeQuest.revenueTarget)}
                          </div>
                        </div>
                      )}

                      {/* Orders Target Card */}
                      {activeQuest.ordersTarget > 0 && (
                        <div className="p-4 rounded-2xl bg-zinc-800/40 border border-white/5 space-y-1">
                          <div className="flex items-center justify-between text-xs text-zinc-400">
                            <span className="flex items-center gap-1.5">
                              <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
                              Orders
                            </span>
                            <span className="font-mono text-amber-400">{progress?.ordersProgressPercent || 0}%</span>
                          </div>
                          <div className="text-base font-bold text-white font-heading">
                            {progress?.currentOrders || 0} / {activeQuest.ordersTarget}
                          </div>
                          <div className="text-[11px] text-zinc-500">
                            {progress?.ordersRemaining === 0 ? "Target Completed" : `${progress?.ordersRemaining} more to reach target`}
                          </div>
                        </div>
                      )}

                      {/* Products Sold Target Card */}
                      {activeQuest.productsTarget > 0 && (
                        <div className="p-4 rounded-2xl bg-zinc-800/40 border border-white/5 space-y-1">
                          <div className="flex items-center justify-between text-xs text-zinc-400">
                            <span className="flex items-center gap-1.5">
                              <Package className="w-3.5 h-3.5 text-orange-400" />
                              Products Sold
                            </span>
                            <span className="font-mono text-orange-400">{progress?.productsProgressPercent || 0}%</span>
                          </div>
                          <div className="text-base font-bold text-white font-heading">
                            {progress?.currentProducts || 0} / {activeQuest.productsTarget}
                          </div>
                          <div className="text-[11px] text-zinc-500">
                            {progress?.productsRemaining === 0 ? "Target Completed" : `${progress?.productsRemaining} units remaining`}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 3. NEXT MILESTONE */}
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="text-xs uppercase tracking-wider text-amber-400 font-semibold flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5" />
                          Next Milestone ({progress?.nextMilestonePercent}%)
                        </div>
                        <div className="text-sm font-medium text-white">
                          {activeQuest.revenueTarget > 0 ? (
                            <>
                              {formatCurrency(progress?.nextMilestoneValue || 0)} —{" "}
                              <span className="text-amber-300">
                                Only {formatCurrency(progress?.remainingToNextMilestone || 0)} to go!
                              </span>
                            </>
                          ) : (
                            <>
                              {progress?.nextMilestoneValue} Orders —{" "}
                              <span className="text-amber-300">
                                Only {progress?.remainingToNextMilestone} orders to go!
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="text-xs text-zinc-400 italic">
                        Keep going. You&apos;re getting closer.
                      </div>
                    </div>

                  </div>
                </Card>

                {/* 2. PERSONAL PROGRESS GRAPH */}
                <Card className="p-6 rounded-3xl bg-zinc-900/90 border border-white/10 shadow-xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-emerald-400" />
                        <h3 className="text-base font-bold font-heading text-white">Your Progress Over Time</h3>
                      </div>
                      <p className="text-xs text-zinc-400">Cumulative sales and order milestones during this quest</p>
                    </div>

                    <div className="text-xs font-mono text-zinc-400">
                      Total Earned: <span className="text-emerald-400 font-bold">{formatCurrency(progress?.currentRevenue || 0)}</span>
                    </div>
                  </div>

                  {/* SVG Chart */}
                  <div className="pt-2">
                    {chartPoints.length === 0 ? (
                      <div className="p-8 text-center text-xs text-zinc-500">
                        No orders recorded yet during this quest period. As you make sales, your real progress will chart here.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="h-44 w-full flex items-end gap-1 sm:gap-2 pt-6 pb-2 px-2 overflow-x-auto">
                          {chartPoints.map((pt, idx) => {
                            const heightPct = maxRevenue > 0 ? Math.max(8, Math.round((pt.cumulativeRevenue / maxRevenue) * 100)) : 8;
                            return (
                              <div
                                key={idx}
                                className="flex-1 min-w-[28px] max-w-[48px] h-full flex flex-col justify-end items-center group relative cursor-pointer"
                              >
                                {/* Tooltip */}
                                <div className="absolute -top-12 bg-zinc-800 text-white text-[10px] py-1 px-2 rounded-md border border-white/10 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none shadow-lg">
                                  <div className="font-bold">{pt.label}</div>
                                  <div>Rev: {formatCurrency(pt.cumulativeRevenue)}</div>
                                  <div>Orders: {pt.cumulativeOrders}</div>
                                </div>

                                {/* Bar */}
                                <div
                                  className="w-full rounded-t-lg bg-gradient-to-t from-maroon-700 via-amber-500 to-emerald-400 group-hover:brightness-125 transition-all"
                                  style={{ height: `${heightPct}%` }}
                                />
                                
                                <span className="text-[9px] text-zinc-500 font-mono mt-1 group-hover:text-zinc-300">
                                  {pt.label.split(" ")[1] || pt.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        <div className="flex justify-between items-center text-[11px] text-zinc-500 font-mono px-2">
                          <span>Quest Start</span>
                          <span>Cumulative Revenue Growth</span>
                          <span>Today</span>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>

                {/* 3. CRAFTAURA PLATFORM QUEST & MYSTERY SURPRISE */}
                {craftauraQuest && (
                  <Card className="relative overflow-hidden bg-gradient-to-br from-zinc-900/90 to-zinc-950 border border-maroon-500/30 p-6 rounded-3xl shadow-lg">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-maroon-500/20 border border-maroon-500/30 flex items-center justify-center text-maroon-400">
                          <Gift className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-[10px] uppercase font-mono tracking-widest text-maroon-400 font-semibold">
                            Monthly Platform Challenge
                          </div>
                          <h3 className="text-lg font-bold font-heading text-white">{craftauraQuest.name}</h3>
                        </div>
                      </div>

                      <div>
                        {craftauraQuest.isJoined ? (
                          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-xs">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            Joined & Tracking
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleJoinCraftauraQuest(craftauraQuest.id)}
                            className="bg-maroon-700 hover:bg-maroon-600 text-white text-xs h-8 rounded-xl"
                          >
                            Join Quest (+{craftauraQuest.pointsReward} pts)
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4 pt-4">
                      <p className="text-sm text-zinc-300">{craftauraQuest.description}</p>

                      {craftauraQuest.isJoined && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs text-zinc-400 font-mono">
                            <span>
                              Progress: {craftauraQuest.currentValue} / {craftauraQuest.targetValue}{" "}
                              {craftauraQuest.targetType}
                            </span>
                            <span>{craftauraQuest.progressPercent}%</span>
                          </div>
                          <div className="w-full bg-zinc-800 rounded-full h-2.5 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-maroon-600 to-amber-500 h-full rounded-full transition-all duration-500"
                              style={{ width: `${craftauraQuest.progressPercent}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* MYSTERY SURPRISE BOX (No winner or ranking leaked) */}
                      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-zinc-900 to-zinc-900 border border-amber-500/20 flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300 shrink-0 text-xl">
                          🎁
                        </div>
                        <div className="space-y-0.5">
                          <div className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                            Mystery Surprise
                          </div>
                          <p className="text-xs text-zinc-300">
                            {craftauraQuest.isCompleted
                              ? "🎉 Quest Complete! You completed this month's Craftaura Quest. Something special is waiting for you."
                              : "Complete this month's Craftaura Quest for something special."}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                )}

              </div>
            )}

          </div>
        )}

        {/* ----------------- TAB 2: PAST QUESTS / HISTORY ----------------- */}
        {activeTab === "history" && (
          <div className="space-y-6">
            <Card className="overflow-hidden bg-zinc-900/90 border border-white/10 rounded-3xl shadow-xl">
              <div className="p-5 border-b border-white/10">
                <h3 className="text-base font-bold font-heading text-white">Your Past Quests</h3>
                <p className="text-xs text-zinc-400">Review your past completed and archived monthly challenges</p>
              </div>

              {!data?.pastQuests || data.pastQuests.length === 0 ? (
                <div className="p-12 text-center text-zinc-500 text-sm">
                  No past quests recorded yet. When your monthly quests conclude, their summaries will appear here.
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {data.pastQuests.map((pq) => (
                    <div key={pq.id} className="p-5 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono uppercase text-zinc-400">{pq.monthName}</span>
                          <Badge variant="outline" className="text-[10px] border-white/10 text-zinc-400 capitalize">
                            {pq.status}
                          </Badge>
                        </div>
                        <h4 className="text-sm font-bold text-white">{pq.questName}</h4>
                        <div className="text-xs text-zinc-400">
                          {pq.revenueTarget > 0 && `Revenue: ${formatCurrency(pq.currentRevenue)} / ${formatCurrency(pq.revenueTarget)} • `}
                          {pq.ordersTarget > 0 && `Orders: ${pq.currentOrders} / ${pq.ordersTarget} • `}
                          {pq.productsTarget > 0 && `Products: ${pq.currentProducts} / ${pq.productsTarget}`}
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="text-sm font-bold text-white font-mono">{pq.progressPercent}%</div>
                          <div className="text-[10px] text-zinc-500">Achieved</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* ----------------- MODAL 1: TEMPLATE SELECTOR (3 DIFFICULTY LEVELS) ----------------- */}
        {isTemplateModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-white/10 rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl animate-in fade-in zoom-in duration-200">
              
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <div>
                  <h3 className="text-lg font-bold font-heading text-white">Choose a Quest Template</h3>
                  <p className="text-xs text-zinc-400">Select a template to customize your targets</p>
                </div>
                <button
                  onClick={() => setIsTemplateModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 3 Template Cards */}
              <div className="grid grid-cols-1 gap-4">
                {templates.map((tpl) => (
                  <div
                    key={tpl.id}
                    onClick={() => handleSelectTemplate(tpl)}
                    className={cn(
                      "p-5 rounded-2xl border transition-all cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-4",
                      tpl.difficulty === "easy"
                        ? "bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-400 hover:bg-emerald-950/30"
                        : tpl.difficulty === "moderate"
                        ? "bg-amber-950/20 border-amber-500/30 hover:border-amber-400 hover:bg-amber-950/30"
                        : "bg-purple-950/20 border-purple-500/30 hover:border-purple-400 hover:bg-purple-950/30"
                    )}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Badge
                          className={cn(
                            "text-[10px] uppercase font-mono",
                            tpl.difficulty === "easy"
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                              : tpl.difficulty === "moderate"
                              ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                              : "bg-purple-500/20 text-purple-300 border-purple-500/40"
                          )}
                        >
                          {tpl.difficulty}
                        </Badge>
                        <h4 className="text-base font-bold text-white font-heading">{tpl.name}</h4>
                      </div>
                      <p className="text-xs text-zinc-400">{tpl.description}</p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right space-y-0.5">
                        <div className="text-sm font-bold text-white font-heading">
                          {formatCurrency(tpl.revenueTarget)}
                        </div>
                        <div className="text-[11px] text-zinc-400 font-mono">
                          {tpl.ordersTarget} orders • {tpl.productsTarget} units
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white group-hover:translate-x-1 transition-transform shrink-0">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsTemplateModalOpen(false);
                    handleOpenCustomCreate();
                  }}
                  className="border-white/10 text-xs text-zinc-400 hover:text-white rounded-xl"
                >
                  Or set a custom quest instead
                </Button>
              </div>

            </div>
          </div>
        )}

        {/* ----------------- MODAL 2: CREATE / EDIT CUSTOM QUEST FORM ----------------- */}
        {isFormModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-white/10 rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl animate-in fade-in zoom-in duration-200">
              
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <div>
                  <h3 className="text-lg font-bold font-heading text-white">
                    {formMode === "edit" ? "Edit Quest Targets" : "Configure Monthly Quest"}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Define one or more targets for your monthly challenge
                  </p>
                </div>
                <button
                  onClick={() => setIsFormModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveQuest} className="space-y-4">
                
                {/* Quest Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Quest Name</label>
                  <Input
                    value={formQuestName}
                    onChange={(e) => setFormQuestName(e.target.value)}
                    placeholder="e.g. September Growth Quest"
                    className="bg-black/50 border-white/10 text-white rounded-xl"
                    required
                  />
                </div>

                {/* Revenue Target */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Revenue Target (₹)</label>
                  <Input
                    type="number"
                    value={formRevenueTarget}
                    onChange={(e) => setFormRevenueTarget(e.target.value)}
                    placeholder="e.g. 10000"
                    className="bg-black/50 border-white/10 text-white rounded-xl"
                  />
                </div>

                {/* Orders Target */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Orders Target</label>
                  <Input
                    type="number"
                    value={formOrdersTarget}
                    onChange={(e) => setFormOrdersTarget(e.target.value)}
                    placeholder="e.g. 15"
                    className="bg-black/50 border-white/10 text-white rounded-xl"
                  />
                </div>

                {/* Products Sold Target */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Products Sold Target (Units)</label>
                  <Input
                    type="number"
                    value={formProductsTarget}
                    onChange={(e) => setFormProductsTarget(e.target.value)}
                    placeholder="e.g. 20"
                    className="bg-black/50 border-white/10 text-white rounded-xl"
                  />
                </div>

                <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs text-zinc-400 flex items-start gap-2">
                  <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    You may fill one, two, or all applicable targets. Your progress updates automatically from real orders.
                  </span>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsFormModalOpen(false)}
                    className="text-zinc-400 hover:text-white rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-maroon-700 hover:bg-maroon-600 text-white rounded-xl font-semibold"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving to Supabase...
                      </>
                    ) : formMode === "edit" ? (
                      "Save Changes"
                    ) : (
                      "Save Quest"
                    )}
                  </Button>
                </div>

              </form>

            </div>
          </div>
        )}

        {/* ----------------- MODAL 3: MY QUEST POINTS & BREAKDOWN ----------------- */}
        {isPointsModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-white/10 rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[85vh] flex flex-col">
              
              <div className="flex justify-between items-center border-b border-white/10 pb-4 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold font-heading text-white">My Quest Points</h3>
                    <p className="text-xs text-zinc-400">Total Score: {totalPoints.toLocaleString()} Points</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsPointsModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Breakdown Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0">
                <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-center">
                  <div className="text-[10px] text-zinc-400 font-semibold uppercase">Orders</div>
                  <div className="text-sm font-bold font-mono text-amber-400">+{pointsBreakdown.ordersPoints}</div>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-center">
                  <div className="text-[10px] text-zinc-400 font-semibold uppercase">Revenue</div>
                  <div className="text-sm font-bold font-mono text-emerald-400">+{pointsBreakdown.revenuePoints}</div>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-center">
                  <div className="text-[10px] text-zinc-400 font-semibold uppercase">Products</div>
                  <div className="text-sm font-bold font-mono text-orange-400">+{pointsBreakdown.productsPoints}</div>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-center">
                  <div className="text-[10px] text-zinc-400 font-semibold uppercase">Milestones</div>
                  <div className="text-sm font-bold font-mono text-purple-400">+{pointsBreakdown.milestonesPoints}</div>
                </div>
              </div>

              {/* Point Rules */}
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1.5 shrink-0 text-xs text-zinc-300">
                <div className="font-bold text-amber-300 uppercase tracking-wider text-[11px]">How Points Are Earned</div>
                <div className="grid grid-cols-2 gap-1 text-[11px]">
                  <div>• Valid order: +{data?.pointRules.pointsPerOrder} pts</div>
                  <div>• Every ₹100 earned: +{data?.pointRules.pointsPerRevenueUnit} pt</div>
                  <div>• Product sold: +{data?.pointRules.pointsPerProductSold} pts</div>
                  <div>• Milestones: +25 to +150 pts</div>
                </div>
              </div>

              {/* Points History */}
              <div className="overflow-y-auto space-y-2 pr-1 flex-1">
                {!data?.recentPoints || data.recentPoints.length === 0 ? (
                  <div className="p-8 text-center text-xs text-zinc-500">
                    No points earned yet. Place orders in your store to earn Quest Points!
                  </div>
                ) : (
                  data.recentPoints.map((p) => (
                    <div
                      key={p.id}
                      className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="text-white font-medium">{p.description}</div>
                        <div className="text-[10px] text-zinc-500">
                          {new Date(p.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="font-bold font-mono text-amber-400">+{p.points} pts</div>
                    </div>
                  ))
                )}
              </div>

            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
