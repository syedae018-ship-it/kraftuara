"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { BarChart3, TrendingUp, Users, ArrowUpRight, Globe, Loader2, Package } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Badge } from "@/components/ui/table";
import { useAuth } from "@/context/auth-context";
import { getStoreAnalyticsAction, AnalyticsSummary } from "@/lib/actions/analytics";
import { AnalyticsCard, TrafficSourcesCard } from "@/components/dashboard/chart-card";
import { PlanGate } from "@/components/dashboard/plan-gate";
import { getPlanDisplayName, normalizePlanTier } from "@/lib/feature-gating";

function getEmptySummary(timeRange: "7D" | "30D" | "90D" = "7D"): AnalyticsSummary {
  const days = timeRange === "7D" ? 7 : timeRange === "30D" ? 30 : 90;
  const trend = Array.from({ length: days }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    return {
      date: d.toISOString().split("T")[0],
      dayLabel: d.toLocaleDateString("en-US", { weekday: "short" }),
      views: 0,
      visitors: 0,
      orders: 0,
      revenue: 0,
    };
  });
  return {
    views: 0,
    visitors: 0,
    productViews: 0,
    addToCarts: 0,
    ordersCount: 0,
    totalRevenue: 0,
    conversionRate: "0.0",
    dailyTrend: trend,
    trafficSources: [],
    topProducts: [],
  };
}

export default function MerchantAnalyticsPage() {
  const { activeStore, user } = useAuth();
  const [timeRange, setTimeRange] = useState<"7D" | "30D" | "90D">("7D");
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const planTier = normalizePlanTier(activeStore?.plan || user?.plan);
  const planDisplayName = getPlanDisplayName(planTier);

  useEffect(() => {
    async function loadAnalytics() {
      if (!activeStore?.id) return;
      setIsLoading(true);
      try {
        const res = await getStoreAnalyticsAction(activeStore.id, timeRange);
        if (res.success && res.analytics) {
          setAnalytics(res.analytics);
        } else {
          setAnalytics(getEmptySummary(timeRange));
        }
      } catch (err) {
        console.error("Failed to load analytics page data:", err);
        setAnalytics(getEmptySummary(timeRange));
      } finally {
        setIsLoading(false);
      }
    }
    loadAnalytics();
  }, [activeStore, timeRange]);

  if (!activeStore) {
    return (
      <DashboardLayout breadcrumbs={[{ label: "Overview", href: "/dashboard" }, { label: "Analytics" }]}>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-maroon-500" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout breadcrumbs={[{ label: "Overview", href: "/dashboard" }, { label: "Analytics" }]}>
      <PlanGate
        requiredPlan="growth"
        featureName="Store Views & Traffic Analytics"
        description={`Upgrade to the ${getPlanDisplayName("growth")} or ${getPlanDisplayName("pro")} to unlock visitor tracking, real-time store views, conversion metrics, and traffic sources.`}
      >
        <div className="space-y-6 text-left">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold font-heading text-white">Analytics Overview</h1>
              <p className="text-xs text-zinc-400 font-body">Track store traffic, conversion metrics, and audience clicks.</p>
            </div>
            <Badge variant="maroon" className="font-semibold text-xs tracking-wider">
              {planDisplayName}
            </Badge>
          </div>

        {/* 3 Metric Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-[#111111] border-white/10 p-5 space-y-3 text-left">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider font-heading">Total Page Views</span>
              <BarChart3 className="w-4 h-4 text-maroon-400" />
            </div>
            <div className="space-y-1">
              <span className="text-2xl font-bold text-white font-mono">
                {isLoading ? "..." : (analytics?.views || 0).toLocaleString()}
              </span>
              {!isLoading && (analytics?.views || 0) > 0 && (
                <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-body">
                  <ArrowUpRight className="w-3 h-3 shrink-0" />
                  <span>Real views tracked</span>
                </div>
              )}
            </div>
          </Card>

          <Card className="bg-[#111111] border-white/10 p-5 space-y-3 text-left">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider font-heading">Unique Visitors</span>
              <Users className="w-4 h-4 text-maroon-400" />
            </div>
            <div className="space-y-1">
              <span className="text-2xl font-bold text-white font-mono">
                {isLoading ? "..." : (analytics?.visitors || 0).toLocaleString()}
              </span>
              {!isLoading && (analytics?.visitors || 0) > 0 && (
                <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-body">
                  <ArrowUpRight className="w-3 h-3 shrink-0" />
                  <span>Unique devices</span>
                </div>
              )}
            </div>
          </Card>

          <Card className="bg-[#111111] border-white/10 p-5 space-y-3 text-left">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider font-heading">Conversion Rate</span>
              <TrendingUp className="w-4 h-4 text-maroon-400" />
            </div>
            <div className="space-y-1">
              <span className="text-2xl font-bold text-white font-mono">
                {isLoading ? "..." : analytics?.conversionRate || "0.00%"}
              </span>
              {!isLoading && (analytics?.views || 0) > 0 && (
                <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-body">
                  <ArrowUpRight className="w-3 h-3 shrink-0" />
                  <span>Orders / Unique Visitors</span>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <AnalyticsCard
              isLoading={isLoading}
              data={analytics?.dailyTrend || []}
              timeRange={timeRange}
              setTimeRange={setTimeRange}
            />
          </div>
          <div>
            <TrafficSourcesCard
              isLoading={isLoading}
              sources={analytics?.trafficSources || []}
            />
          </div>
        </div>

        {/* Top Viewed Products Listing */}
        <Card className="p-6 space-y-4 bg-[#151515] border-white/10 text-left">
          <div>
            <h3 className="text-base font-bold font-heading text-white tracking-tight">
              Top Viewed Catalog Products
            </h3>
            <p className="text-xs text-zinc-400 font-body mt-0.5">
              Your storefront items ranked by actual client views over the selected time range.
            </p>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              <Loader2 className="w-6 h-6 animate-spin text-maroon-500 mx-auto" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead className="text-right">Views</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!analytics?.topProducts || analytics.topProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center py-8 text-zinc-500">
                      <Package className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                      No product activity yet
                    </TableCell>
                  </TableRow>
                ) : (
                  analytics.topProducts.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-semibold text-white">{item.name}</TableCell>
                      <TableCell className="text-right font-mono text-emerald-400">{item.views.toLocaleString()} views</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
      </PlanGate>
    </DashboardLayout>
  );
}
