"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Store, Users, ShoppingBag, CreditCard } from "lucide-react";
import { getAdminOverviewMetricsAction } from "@/lib/actions/admin";
import { PlatformStats } from "@/types/admin";
import { formatCurrency } from "@/lib/utils";

export function AnalyticsChart() {
  const [stats, setStats] = useState<PlatformStats | null>(null);

  useEffect(() => {
    async function loadData() {
      const res = await getAdminOverviewMetricsAction();
      if (res.success && res.data) {
        setStats(res.data);
      }
    }
    loadData();
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-body text-left">
      {/* MRR & Revenue Growth Visualizer */}
      <Card className="p-6 space-y-4 bg-[#151515] border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-400" />
            <h4 className="text-sm font-bold font-heading text-white">Platform Subscriptions & MRR</h4>
          </div>
          <span className="text-xs font-mono text-emerald-400 font-bold">
            {formatCurrency(stats?.mrr || 0)} / mo
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-2">
          <div className="p-3 rounded-xl bg-[#111111] border border-white/5 space-y-1">
            <span className="text-[10px] text-zinc-500 font-mono block">STARTUP (₹99)</span>
            <span className="text-lg font-bold font-heading text-white">{stats?.planStarterCount || 0}</span>
          </div>
          <div className="p-3 rounded-xl bg-[#111111] border border-white/5 space-y-1">
            <span className="text-[10px] text-zinc-500 font-mono block">GROWTH (₹299)</span>
            <span className="text-lg font-bold font-heading text-white">{stats?.planProCount || 0}</span>
          </div>
          <div className="p-3 rounded-xl bg-[#111111] border border-white/5 space-y-1">
            <span className="text-[10px] text-zinc-500 font-mono block">PRO (₹499)</span>
            <span className="text-lg font-bold font-heading text-white">{stats?.planBusinessCount || 0}</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-800/30 flex justify-between items-center text-xs">
          <span className="text-zinc-300">Total Lifetime Revenue Collected</span>
          <span className="font-mono font-bold text-emerald-400 text-sm">
            {formatCurrency(stats?.totalRevenue || 0)}
          </span>
        </div>
      </Card>

      {/* Multi-Tenant Stores & Catalog Volume */}
      <Card className="p-6 space-y-4 bg-[#151515] border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-maroon-400" />
            <h4 className="text-sm font-bold font-heading text-white">Merchant Stores & Catalog Volume</h4>
          </div>
          <span className="text-xs font-mono text-maroon-300 font-bold">
            {stats?.liveStores || 0} Live / {stats?.activeStores || 0} Total
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-2">
          <div className="p-3 rounded-xl bg-[#111111] border border-white/5 space-y-1">
            <span className="text-[10px] text-zinc-500 font-mono block">MERCHANTS</span>
            <span className="text-lg font-bold font-heading text-white">{stats?.totalUsers || 0}</span>
          </div>
          <div className="p-3 rounded-xl bg-[#111111] border border-white/5 space-y-1">
            <span className="text-[10px] text-zinc-500 font-mono block">PRODUCTS</span>
            <span className="text-lg font-bold font-heading text-white">{stats?.totalProducts || 0}</span>
          </div>
          <div className="p-3 rounded-xl bg-[#111111] border border-white/5 space-y-1">
            <span className="text-[10px] text-zinc-500 font-mono block">ORDERS</span>
            <span className="text-lg font-bold font-heading text-white">{stats?.creativeOrders || 0}</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-maroon-950/20 border border-maroon-800/30 flex justify-between items-center text-xs">
          <span className="text-zinc-300">Active Multi-Tenant Subdomains</span>
          <span className="font-mono font-bold text-maroon-300 text-sm">
            {stats?.liveStores || 0} Storefronts
          </span>
        </div>
      </Card>
    </div>
  );
}
