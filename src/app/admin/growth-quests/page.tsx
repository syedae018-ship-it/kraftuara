"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "@/components/admin/layout/admin-layout";
import {
  Target,
  Trophy,
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  Save,
  RefreshCw,
  Gift,
  Search,
  CheckCircle2,
  Clock,
  Layers,
  Settings,
  Users,
  Check,
  X,
  Loader2,
  Award,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import {
  getAdminGrowthOverviewAction,
  getAdminTemplatesAction,
  saveAdminTemplateAction,
  deleteAdminTemplateAction,
  getAdminCraftauraQuestsAction,
  saveAdminCraftauraQuestAction,
  deleteAdminCraftauraQuestAction,
  getAdminPointRulesAction,
  saveAdminPointRulesAction,
  getAdminLeaderboardAction,
  createMonthlySnapshotAction,
  updateWinnerRewardStatusAction,
} from "@/lib/actions/admin-growth-quests";
import { PointRuleConfig, DEFAULT_POINT_RULES } from "@/lib/services/growth-quest-service";
import { formatCurrency, cn } from "@/lib/utils";

export default function AdminGrowthQuestsPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "templates" | "craftaura" | "leaderboard" | "point_rules">("overview");
  const [isLoading, setIsLoading] = useState(true);

  // Overview Stats
  const [overview, setOverview] = useState<any>(null);

  // Templates State
  const [templates, setTemplates] = useState<any[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  // Craftaura Quests State
  const [craftauraQuests, setCraftauraQuests] = useState<any[]>([]);
  const [editingCq, setEditingCq] = useState<any | null>(null);
  const [isCqModalOpen, setIsCqModalOpen] = useState(false);

  // Point Rules State
  const [pointRules, setPointRules] = useState<PointRuleConfig>(DEFAULT_POINT_RULES);
  const [isSavingRules, setIsSavingRules] = useState(false);

  // Leaderboard State
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [leaderboardData, setLeaderboardData] = useState<{ isSnapshot: boolean; rankings: any[] }>({
    isSnapshot: false,
    rankings: [],
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [isTakingSnapshot, setIsTakingSnapshot] = useState(false);

  // Load all initial admin data
  const loadOverview = useCallback(async () => {
    setIsLoading(true);
    try {
      const [ovRes, tplRes, cqRes, rulesRes, lbRes] = await Promise.all([
        getAdminGrowthOverviewAction(),
        getAdminTemplatesAction(),
        getAdminCraftauraQuestsAction(),
        getAdminPointRulesAction(),
        getAdminLeaderboardAction(selectedMonth, selectedYear),
      ]);

      if (ovRes.success && ovRes.data) setOverview(ovRes.data);
      if (tplRes.success && tplRes.templates) setTemplates(tplRes.templates);
      if (cqRes.success && cqRes.quests) setCraftauraQuests(cqRes.quests);
      if (rulesRes.success && rulesRes.rules) setPointRules(rulesRes.rules);
      if (lbRes.success && lbRes.data) setLeaderboardData(lbRes.data);
    } catch (err: any) {
      toast.error("Error", err.message || "Failed to load admin Growth Quest data.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  // Handle Leaderboard Month Change
  const handleRefreshLeaderboard = async (m: number, y: number) => {
    try {
      const res = await getAdminLeaderboardAction(m, y);
      if (res.success && res.data) {
        setLeaderboardData(res.data);
      }
    } catch (err: any) {
      toast.error("Error", err.message || "Failed to refresh leaderboard.");
    }
  };

  // Handle Create Snapshot
  const handleCreateSnapshot = async () => {
    if (!confirm(`Are you sure you want to capture the official snapshot for ${selectedMonth}/${selectedYear}? This freezes the final rankings and records the champion.`)) {
      return;
    }
    setIsTakingSnapshot(true);
    try {
      const res = await createMonthlySnapshotAction(selectedMonth, selectedYear);
      if (res.success) {
        toast.success("Snapshot Recorded", `Leaderboard snapshot preserved for ${selectedMonth}/${selectedYear}.`);
        await handleRefreshLeaderboard(selectedMonth, selectedYear);
      } else {
        toast.error("Error", res.error || "Failed to create snapshot.");
      }
    } catch (err: any) {
      toast.error("Error", err.message || "Failed to create snapshot.");
    } finally {
      setIsTakingSnapshot(false);
    }
  };

  // Handle Save Template
  const handleSaveTemplateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate) return;
    try {
      const res = await saveAdminTemplateAction({
        id: editingTemplate.id,
        name: editingTemplate.name,
        description: editingTemplate.description,
        difficulty: editingTemplate.difficulty,
        monthDuration: Number(editingTemplate.month_duration || 1),
        revenueTarget: Number(editingTemplate.revenue_target || 0),
        ordersTarget: Number(editingTemplate.orders_target || 0),
        productsTarget: Number(editingTemplate.products_target || 0),
        isActive: Boolean(editingTemplate.is_active),
        sortOrder: Number(editingTemplate.sort_order || 0),
      });

      if (res.success) {
        toast.success("Template Saved", "Growth Quest template configuration updated.");
        setIsTemplateModalOpen(false);
        const tplRes = await getAdminTemplatesAction();
        if (tplRes.templates) setTemplates(tplRes.templates);
      } else {
        toast.error("Save Failed", res.error || "Failed to save template.");
      }
    } catch (err: any) {
      toast.error("Error", err.message || "Failed to save template.");
    }
  };

  // Handle Delete Template
  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;
    try {
      const res = await deleteAdminTemplateAction(id);
      if (res.success) {
        toast.success("Template Deleted", "Template removed.");
        const tplRes = await getAdminTemplatesAction();
        if (tplRes.templates) setTemplates(tplRes.templates);
      } else {
        toast.error("Error", res.error || "Failed to delete template.");
      }
    } catch (err: any) {
      toast.error("Error", err.message || "Failed to delete template.");
    }
  };

  // Handle Save Craftaura Quest
  const handleSaveCqSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCq) return;
    try {
      const res = await saveAdminCraftauraQuestAction({
        id: editingCq.id,
        name: editingCq.name,
        description: editingCq.description,
        startDate: editingCq.start_date,
        endDate: editingCq.end_date,
        targetType: editingCq.target_type,
        targetValue: Number(editingCq.target_value || 0),
        pointsReward: Number(editingCq.points_reward || 500),
        mysteryRewardDescription: editingCq.mystery_reward_description || "Special Mystery Surprise",
        isActive: Boolean(editingCq.is_active),
      });

      if (res.success) {
        toast.success("Quest Saved", "Craftaura challenge saved successfully.");
        setIsCqModalOpen(false);
        const cqRes = await getAdminCraftauraQuestsAction();
        if (cqRes.quests) setCraftauraQuests(cqRes.quests);
      } else {
        toast.error("Save Failed", res.error || "Failed to save challenge.");
      }
    } catch (err: any) {
      toast.error("Error", err.message || "Failed to save challenge.");
    }
  };

  // Handle Delete Craftaura Quest
  const handleDeleteCq = async (id: string) => {
    if (!confirm("Are you sure you want to delete this Craftaura Quest?")) return;
    try {
      const res = await deleteAdminCraftauraQuestAction(id);
      if (res.success) {
        toast.success("Quest Deleted", "Craftaura Quest removed.");
        const cqRes = await getAdminCraftauraQuestsAction();
        if (cqRes.quests) setCraftauraQuests(cqRes.quests);
      } else {
        toast.error("Error", res.error || "Failed to delete quest.");
      }
    } catch (err: any) {
      toast.error("Error", err.message || "Failed to delete quest.");
    }
  };

  // Handle Save Point Rules
  const handleSavePointRules = async () => {
    setIsSavingRules(true);
    try {
      const res = await saveAdminPointRulesAction(pointRules);
      if (res.success) {
        toast.success("Point Rules Saved", "Point scoring parameters updated platform-wide.");
      } else {
        toast.error("Save Failed", res.error || "Failed to update point rules.");
      }
    } catch (err: any) {
      toast.error("Error", err.message || "Failed to update point rules.");
    } finally {
      setIsSavingRules(false);
    }
  };

  // Filtered Leaderboard
  const filteredRankings = leaderboardData.rankings.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.storeName?.toLowerCase().includes(q) ||
      r.storeSlug?.toLowerCase().includes(q) ||
      r.ownerEmail?.toLowerCase().includes(q)
    );
  });

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-7xl mx-auto pb-16 font-body text-zinc-100">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-maroon-800 to-maroon-950 border border-maroon-600/50 flex items-center justify-center text-white shadow-glow">
                <Target className="w-5 h-5 text-maroon-300" />
              </div>
              <div>
                <h1 className="text-2xl font-bold font-heading text-white tracking-tight">Growth Quest Control</h1>
                <p className="text-xs text-zinc-400">Manage merchant goal templates, monthly challenges, point scoring & leaderboards</p>
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => loadOverview()}
            disabled={isLoading}
            className="border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 h-9"
          >
            <RefreshCw className={cn("w-3.5 h-3.5 mr-1.5", isLoading && "animate-spin text-amber-400")} />
            Refresh
          </Button>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 border-b border-white/10 pb-2">
          <button
            onClick={() => setActiveTab("overview")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
              activeTab === "overview"
                ? "bg-maroon-700/80 text-white border border-maroon-600/50 shadow-md"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            )}
          >
            <Target className="w-4 h-4" />
            Overview
          </button>

          <button
            onClick={() => setActiveTab("templates")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
              activeTab === "templates"
                ? "bg-maroon-700/80 text-white border border-maroon-600/50 shadow-md"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            )}
          >
            <Layers className="w-4 h-4" />
            Goal Templates
          </button>

          <button
            onClick={() => setActiveTab("craftaura")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
              activeTab === "craftaura"
                ? "bg-maroon-700/80 text-white border border-maroon-600/50 shadow-md"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            )}
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            Craftaura Quests
          </button>

          <button
            onClick={() => setActiveTab("leaderboard")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
              activeTab === "leaderboard"
                ? "bg-maroon-700/80 text-white border border-maroon-600/50 shadow-md"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            )}
          >
            <Award className="w-4 h-4 text-amber-400" />
            Leaderboard & Snapshots
          </button>

          <button
            onClick={() => setActiveTab("point_rules")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
              activeTab === "point_rules"
                ? "bg-maroon-700/80 text-white border border-maroon-600/50 shadow-md"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            )}
          >
            <Settings className="w-4 h-4 text-zinc-300" />
            Point Scoring Rules
          </button>
        </div>

        {/* ----------------- TAB 1: OVERVIEW ----------------- */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-5 rounded-2xl bg-zinc-900/90 border border-white/10 space-y-1">
                <div className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">Active Quests</div>
                <div className="text-2xl font-bold font-heading text-white">{overview?.activeQuests || 0}</div>
                <div className="text-[11px] text-zinc-500">{overview?.totalQuests || 0} total merchant quests</div>
              </Card>

              <Card className="p-5 rounded-2xl bg-zinc-900/90 border border-white/10 space-y-1">
                <div className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">Total Completed</div>
                <div className="text-2xl font-bold font-heading text-emerald-400">{overview?.completedQuests || 0}</div>
                <div className="text-[11px] text-zinc-500">100% goal achievements</div>
              </Card>

              <Card className="p-5 rounded-2xl bg-zinc-900/90 border border-white/10 space-y-1">
                <div className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">Quest Points Awarded</div>
                <div className="text-2xl font-bold font-heading text-amber-400">
                  {(overview?.totalPointsAwarded || 0).toLocaleString()}
                </div>
                <div className="text-[11px] text-zinc-500">Idempotent verified points</div>
              </Card>

              <Card className="p-5 rounded-2xl bg-zinc-900/90 border border-white/10 space-y-1">
                <div className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">Challenge Participants</div>
                <div className="text-2xl font-bold font-heading text-white">{overview?.activeParticipantsCount || 0}</div>
                <div className="text-[11px] text-zinc-500">In platform monthly challenges</div>
              </Card>
            </div>

            {/* Quick Actions Card */}
            <Card className="p-6 rounded-3xl bg-zinc-900/90 border border-white/10 space-y-4">
              <h3 className="text-base font-bold font-heading text-white">System Architecture & Gamification Principles</h3>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Growth Quest is purposefully designed without complex RPG trees or arbitrary levels. Progress derives strictly from real Supabase store orders and quantities. Points are stored in a dedicated database ledger with unique event constraints, preventing duplicate rewards.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1">
                  <div className="text-xs font-bold text-amber-300">1. Templates</div>
                  <p className="text-[11px] text-zinc-400">Easy (₹3K), Moderate (₹10K), Difficult (₹25K) configurable in Supabase.</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1">
                  <div className="text-xs font-bold text-amber-300">2. Real Orders</div>
                  <p className="text-[11px] text-zinc-400">Live order amount, order count, and line item units sum automatically.</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1">
                  <div className="text-xs font-bold text-amber-300">3. Monthly Snapshots</div>
                  <p className="text-[11px] text-zinc-400">Preserve monthly leaderboard winners for historical accuracy.</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* ----------------- TAB 2: TEMPLATES ----------------- */}
        {activeTab === "templates" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold font-heading text-white">Monthly Quest Templates</h3>
                <p className="text-xs text-zinc-400">Configure standard starter challenges available to merchants</p>
              </div>
              <Button
                onClick={() => {
                  setEditingTemplate({
                    name: "New Template",
                    description: "Encouraging challenge description",
                    difficulty: "easy",
                    month_duration: 1,
                    revenue_target: 5000,
                    orders_target: 8,
                    products_target: 10,
                    is_active: true,
                    sort_order: templates.length + 1,
                  });
                  setIsTemplateModalOpen(true);
                }}
                size="sm"
                className="bg-maroon-700 hover:bg-maroon-600 text-white text-xs h-9"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Template
              </Button>
            </div>

            <Card className="overflow-hidden bg-zinc-900/90 border border-white/10 rounded-3xl shadow-xl">
              <div className="divide-y divide-white/5">
                {templates.map((tpl) => (
                  <div key={tpl.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/5 transition-colors">
                    <div className="space-y-1">
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
                        {!tpl.is_active && (
                          <Badge variant="outline" className="text-[10px] border-zinc-700 text-zinc-500">
                            Disabled
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400">{tpl.description}</p>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right space-y-0.5">
                        <div className="text-sm font-bold text-white font-heading">
                          {formatCurrency(tpl.revenue_target)}
                        </div>
                        <div className="text-[11px] text-zinc-400 font-mono">
                          {tpl.orders_target} orders • {tpl.products_target} units
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingTemplate(tpl);
                            setIsTemplateModalOpen(true);
                          }}
                          className="border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 h-8 text-xs"
                        >
                          <Edit2 className="w-3.5 h-3.5 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTemplate(tpl.id)}
                          className="text-zinc-500 hover:text-red-400 hover:bg-red-500/10 h-8 text-xs"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* ----------------- TAB 3: CRAFTAURA QUESTS ----------------- */}
        {activeTab === "craftaura" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold font-heading text-white">Craftaura Platform Quests</h3>
                <p className="text-xs text-zinc-400">Monthly challenges open to all merchants with mystery rewards</p>
              </div>
              <Button
                onClick={() => {
                  const now = new Date();
                  const startStr = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
                  const endStr = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
                  setEditingCq({
                    name: "Monthly Challenge",
                    description: "Complete 15 orders this month to earn 500 Quest Points & Mystery Surprise!",
                    start_date: startStr,
                    end_date: endStr,
                    target_type: "orders",
                    target_value: 15,
                    points_reward: 500,
                    mystery_reward_description: "Special handcrafted gift box from Craftaura",
                    is_active: true,
                  });
                  setIsCqModalOpen(true);
                }}
                size="sm"
                className="bg-maroon-700 hover:bg-maroon-600 text-white text-xs h-9"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Create Monthly Challenge
              </Button>
            </div>

            <Card className="overflow-hidden bg-zinc-900/90 border border-white/10 rounded-3xl shadow-xl">
              <div className="divide-y divide-white/5">
                {craftauraQuests.map((cq) => (
                  <div key={cq.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/5 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold text-white font-heading">{cq.name}</h4>
                        <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px]">
                          +{cq.points_reward} pts
                        </Badge>
                        {!cq.is_active && (
                          <Badge variant="outline" className="text-[10px] border-zinc-700 text-zinc-500">
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400">{cq.description}</p>
                      <div className="text-[11px] text-zinc-500">
                        {new Date(cq.start_date).toLocaleDateString()} to {new Date(cq.end_date).toLocaleDateString()} • Target: {cq.target_value} {cq.target_type}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-xs font-bold text-amber-300">🎁 Mystery Reward</div>
                        <div className="text-[11px] text-zinc-400 max-w-[200px] truncate">{cq.mystery_reward_description}</div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingCq(cq);
                            setIsCqModalOpen(true);
                          }}
                          className="border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 h-8 text-xs"
                        >
                          <Edit2 className="w-3.5 h-3.5 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCq(cq.id)}
                          className="text-zinc-500 hover:text-red-400 hover:bg-red-500/10 h-8 text-xs"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* ----------------- TAB 4: LEADERBOARD & SNAPSHOTS ----------------- */}
        {activeTab === "leaderboard" && (
          <div className="space-y-6">
            
            {/* Filter & Controls Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <select
                  value={selectedMonth}
                  onChange={(e) => {
                    const m = parseInt(e.target.value, 10);
                    setSelectedMonth(m);
                    handleRefreshLeaderboard(m, selectedYear);
                  }}
                  className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                >
                  {[
                    "January", "February", "March", "April", "May", "June",
                    "July", "August", "September", "October", "November", "December"
                  ].map((name, i) => (
                    <option key={name} value={i + 1}>{name}</option>
                  ))}
                </select>

                <select
                  value={selectedYear}
                  onChange={(e) => {
                    const y = parseInt(e.target.value, 10);
                    setSelectedYear(y);
                    handleRefreshLeaderboard(selectedMonth, y);
                  }}
                  className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                >
                  {[2025, 2026, 2027].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>

                {leaderboardData.isSnapshot ? (
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    Preserved Snapshot
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-zinc-400 border-white/10 text-xs">
                    Live Calculating
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                  <Input
                    placeholder="Search merchant or store..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-zinc-900/90 border-white/10 text-xs w-60 h-9"
                  />
                </div>

                <Button
                  onClick={handleCreateSnapshot}
                  disabled={isTakingSnapshot}
                  size="sm"
                  className="bg-amber-600 hover:bg-amber-500 text-black font-semibold text-xs h-9"
                >
                  {isTakingSnapshot ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                  ) : (
                    <Trophy className="w-3.5 h-3.5 mr-1" />
                  )}
                  Save Official Snapshot
                </Button>
              </div>
            </div>

            {/* Leaderboard Table */}
            <Card className="overflow-hidden bg-zinc-900/90 border border-white/10 rounded-3xl shadow-xl">
              {filteredRankings.length === 0 ? (
                <div className="p-12 text-center text-zinc-500 text-sm">
                  No merchant scores recorded for this period.
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {filteredRankings.map((r) => (
                    <div key={r.storeId} className="p-4 sm:px-6 flex items-center justify-between hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-4">
                        <div
                          className={cn(
                            "w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs font-mono shrink-0",
                            r.rank === 1
                              ? "bg-amber-500 text-black shadow-md"
                              : r.rank === 2
                              ? "bg-zinc-300 text-black"
                              : r.rank === 3
                              ? "bg-amber-700 text-white"
                              : "bg-zinc-800 text-zinc-400"
                          )}
                        >
                          {r.rank}
                        </div>

                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-white">{r.storeName}</span>
                            {r.isWinner && (
                              <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px]">
                                🏆 Monthly Champion
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-zinc-500">
                            @{r.storeSlug} • {r.ownerEmail}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="text-sm font-bold font-mono text-amber-400">
                            {r.points.toLocaleString()} pts
                          </div>
                          <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Quest Points</div>
                        </div>

                        {leaderboardData.isSnapshot && (
                          <select
                            value={r.rewardStatus || "pending"}
                            onChange={async (e) => {
                              const newStatus = e.target.value as any;
                              await updateWinnerRewardStatusAction(r.storeId, selectedMonth, selectedYear, newStatus);
                              toast.success("Reward Status Updated", `Set to ${newStatus}`);
                              await handleRefreshLeaderboard(selectedMonth, selectedYear);
                            }}
                            className="bg-zinc-800 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-zinc-300 focus:outline-none"
                          >
                            <option value="pending">Pending Reward</option>
                            <option value="delivered">Reward Delivered</option>
                            <option value="claimed">Claimed</option>
                          </select>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* ----------------- TAB 5: POINT RULES CONFIGURATION ----------------- */}
        {activeTab === "point_rules" && (
          <div className="space-y-6 max-w-3xl">
            <div>
              <h3 className="text-lg font-bold font-heading text-white">Point Scoring Rules</h3>
              <p className="text-xs text-zinc-400">Adjust the mathematical formulas for Quest Points awarded on real orders & milestones</p>
            </div>

            <Card className="p-6 rounded-3xl bg-zinc-900/90 border border-white/10 space-y-6 shadow-xl">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Points Per Order */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Points Per Valid Order</label>
                  <Input
                    type="number"
                    value={pointRules.pointsPerOrder}
                    onChange={(e) => setPointRules({ ...pointRules, pointsPerOrder: parseInt(e.target.value, 10) || 0 })}
                    className="bg-black/50 border-white/10 text-white"
                  />
                  <span className="text-[11px] text-zinc-500">Awarded immediately when order placed</span>
                </div>

                {/* Points Per Revenue Unit */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Points Per Every ₹100 Revenue</label>
                  <Input
                    type="number"
                    value={pointRules.pointsPerRevenueUnit}
                    onChange={(e) => setPointRules({ ...pointRules, pointsPerRevenueUnit: parseInt(e.target.value, 10) || 0 })}
                    className="bg-black/50 border-white/10 text-white"
                  />
                  <span className="text-[11px] text-zinc-500">Scaled based on total order revenue</span>
                </div>

                {/* Points Per Product Sold */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Points Per Product Sold (Units)</label>
                  <Input
                    type="number"
                    value={pointRules.pointsPerProductSold}
                    onChange={(e) => setPointRules({ ...pointRules, pointsPerProductSold: parseInt(e.target.value, 10) || 0 })}
                    className="bg-black/50 border-white/10 text-white"
                  />
                  <span className="text-[11px] text-zinc-500">Derived from order item quantities</span>
                </div>

                {/* Craftaura Challenge Bonus */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Default Craftaura Quest Bonus</label>
                  <Input
                    type="number"
                    value={pointRules.craftauraQuestDefaultPoints}
                    onChange={(e) => setPointRules({ ...pointRules, craftauraQuestDefaultPoints: parseInt(e.target.value, 10) || 0 })}
                    className="bg-black/50 border-white/10 text-white"
                  />
                  <span className="text-[11px] text-zinc-500">Platform monthly challenge reward</span>
                </div>

              </div>

              {/* Milestone Bonuses */}
              <div className="border-t border-white/10 pt-4 space-y-3">
                <div className="text-xs font-bold text-amber-300 uppercase tracking-wider">Milestone Bonuses</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] text-zinc-400">25% Milestone</label>
                    <Input
                      type="number"
                      value={pointRules.milestone25Points}
                      onChange={(e) => setPointRules({ ...pointRules, milestone25Points: parseInt(e.target.value, 10) || 0 })}
                      className="bg-black/50 border-white/10 text-white text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-zinc-400">50% Milestone</label>
                    <Input
                      type="number"
                      value={pointRules.milestone50Points}
                      onChange={(e) => setPointRules({ ...pointRules, milestone50Points: parseInt(e.target.value, 10) || 0 })}
                      className="bg-black/50 border-white/10 text-white text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-zinc-400">75% Milestone</label>
                    <Input
                      type="number"
                      value={pointRules.milestone75Points}
                      onChange={(e) => setPointRules({ ...pointRules, milestone75Points: parseInt(e.target.value, 10) || 0 })}
                      className="bg-black/50 border-white/10 text-white text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-zinc-400">100% (Completion)</label>
                    <Input
                      type="number"
                      value={pointRules.milestone100Points}
                      onChange={(e) => setPointRules({ ...pointRules, milestone100Points: parseInt(e.target.value, 10) || 0 })}
                      className="bg-black/50 border-white/10 text-white text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-white/10">
                <Button
                  onClick={handleSavePointRules}
                  disabled={isSavingRules}
                  className="bg-maroon-700 hover:bg-maroon-600 text-white text-xs"
                >
                  {isSavingRules ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Save className="w-4 h-4 mr-1.5" />}
                  Save Point Rules
                </Button>
              </div>

            </Card>
          </div>
        )}

        {/* ----------------- TEMPLATE MODAL ----------------- */}
        {isTemplateModalOpen && editingTemplate && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-white/10 rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl animate-in fade-in zoom-in duration-200">
              
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <h3 className="text-lg font-bold font-heading text-white">
                  {editingTemplate.id ? "Edit Quest Template" : "Create Quest Template"}
                </h3>
                <button
                  onClick={() => setIsTemplateModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveTemplateSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Template Name</label>
                  <Input
                    value={editingTemplate.name}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                    required
                    className="bg-black/50 border-white/10 text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Description</label>
                  <Input
                    value={editingTemplate.description}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, description: e.target.value })}
                    required
                    className="bg-black/50 border-white/10 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-300">Difficulty</label>
                    <select
                      value={editingTemplate.difficulty}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, difficulty: e.target.value })}
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                    >
                      <option value="easy">Easy</option>
                      <option value="moderate">Moderate</option>
                      <option value="difficult">Difficult</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-300">Sort Order</label>
                    <Input
                      type="number"
                      value={editingTemplate.sort_order || 0}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, sort_order: parseInt(e.target.value, 10) || 0 })}
                      className="bg-black/50 border-white/10 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-300">Revenue (₹)</label>
                    <Input
                      type="number"
                      value={editingTemplate.revenue_target || 0}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, revenue_target: parseFloat(e.target.value) || 0 })}
                      className="bg-black/50 border-white/10 text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-300">Orders</label>
                    <Input
                      type="number"
                      value={editingTemplate.orders_target || 0}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, orders_target: parseInt(e.target.value, 10) || 0 })}
                      className="bg-black/50 border-white/10 text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-300">Products Sold</label>
                    <Input
                      type="number"
                      value={editingTemplate.products_target || 0}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, products_target: parseInt(e.target.value, 10) || 0 })}
                      className="bg-black/50 border-white/10 text-white"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="tpl_active"
                    checked={editingTemplate.is_active}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, is_active: e.target.checked })}
                    className="rounded border-white/20 bg-black/50 text-maroon-600"
                  />
                  <label htmlFor="tpl_active" className="text-xs text-zinc-300">
                    Template Active & Visible to Merchants
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                  <Button type="button" variant="ghost" onClick={() => setIsTemplateModalOpen(false)} className="text-zinc-400 hover:text-white">
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-maroon-700 hover:bg-maroon-600 text-white">
                    Save Template
                  </Button>
                </div>
              </form>

            </div>
          </div>
        )}

        {/* ----------------- CRAFTAURA QUEST MODAL ----------------- */}
        {isCqModalOpen && editingCq && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-white/10 rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl animate-in fade-in zoom-in duration-200">
              
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <h3 className="text-lg font-bold font-heading text-white">
                  {editingCq.id ? "Edit Craftaura Quest" : "Create Craftaura Monthly Quest"}
                </h3>
                <button
                  onClick={() => setIsCqModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveCqSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Challenge Name</label>
                  <Input
                    value={editingCq.name}
                    onChange={(e) => setEditingCq({ ...editingCq, name: e.target.value })}
                    required
                    className="bg-black/50 border-white/10 text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Description</label>
                  <Input
                    value={editingCq.description}
                    onChange={(e) => setEditingCq({ ...editingCq, description: e.target.value })}
                    required
                    className="bg-black/50 border-white/10 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-300">Start Date</label>
                    <Input
                      type="date"
                      value={editingCq.start_date ? editingCq.start_date.slice(0, 10) : ""}
                      onChange={(e) => setEditingCq({ ...editingCq, start_date: e.target.value })}
                      required
                      className="bg-black/50 border-white/10 text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-300">End Date</label>
                    <Input
                      type="date"
                      value={editingCq.end_date ? editingCq.end_date.slice(0, 10) : ""}
                      onChange={(e) => setEditingCq({ ...editingCq, end_date: e.target.value })}
                      required
                      className="bg-black/50 border-white/10 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-300">Target Type</label>
                    <select
                      value={editingCq.target_type}
                      onChange={(e) => setEditingCq({ ...editingCq, target_type: e.target.value })}
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                    >
                      <option value="orders">Orders</option>
                      <option value="revenue">Revenue (₹)</option>
                      <option value="products">Products</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-300">Target Value</label>
                    <Input
                      type="number"
                      value={editingCq.target_value || 0}
                      onChange={(e) => setEditingCq({ ...editingCq, target_value: parseFloat(e.target.value) || 0 })}
                      className="bg-black/50 border-white/10 text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-300">Points Reward</label>
                    <Input
                      type="number"
                      value={editingCq.points_reward || 500}
                      onChange={(e) => setEditingCq({ ...editingCq, points_reward: parseInt(e.target.value, 10) || 0 })}
                      className="bg-black/50 border-white/10 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">🎁 Mystery Surprise Description (Admin only until achieved)</label>
                  <Input
                    value={editingCq.mystery_reward_description || ""}
                    onChange={(e) => setEditingCq({ ...editingCq, mystery_reward_description: e.target.value })}
                    placeholder="e.g. Free promotion boost & handcrafted gift box"
                    className="bg-black/50 border-white/10 text-white"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="cq_active"
                    checked={editingCq.is_active}
                    onChange={(e) => setEditingCq({ ...editingCq, is_active: e.target.checked })}
                    className="rounded border-white/20 bg-black/50 text-maroon-600"
                  />
                  <label htmlFor="cq_active" className="text-xs text-zinc-300">
                    Challenge Active for Merchants
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                  <Button type="button" variant="ghost" onClick={() => setIsCqModalOpen(false)} className="text-zinc-400 hover:text-white">
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-maroon-700 hover:bg-maroon-600 text-white">
                    Save Challenge
                  </Button>
                </div>
              </form>

            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
}
