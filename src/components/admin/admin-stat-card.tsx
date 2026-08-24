"use client";

import React from "react";
import { StatCard } from "@/components/dashboard/stat-card";
import { Users, Store, Package, Sparkles, DollarSign, Activity } from "lucide-react";
import { PlatformStats } from "@/types/admin";
import { formatCurrency } from "@/lib/utils";

export function AdminStatCard({ stats }: { stats: PlatformStats }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Total Merchant Users"
        value={stats.totalUsers.toString()}
        delta={{ value: `+${stats.growthPercent}% growth`, isPositive: true }}
        subtitle="Registered SaaS accounts"
        icon={<Users className="w-4 h-4 text-maroon-400" />}
        variant="maroon"
      />
      <StatCard
        title="Live Stores"
        value={`${stats.liveStores} / ${stats.activeStores}`}
        delta={{ value: "94 active domains", isPositive: true }}
        subtitle="Active storefronts"
        icon={<Store className="w-4 h-4" />}
      />
      <StatCard
        title="Gross Platform MRR"
        value={formatCurrency(stats.mrr)}
        delta={{ value: "+18.4% MRR", isPositive: true }}
        subtitle="Monthly recurring revenue"
        icon={<DollarSign className="w-4 h-4 text-emerald-400" />}
      />
      <StatCard
        title="Platform Health"
        value={stats.platformHealth.toUpperCase()}
        subtitle="99.99% Uptime SLA"
        icon={<Activity className="w-4 h-4 text-emerald-400" />}
      />
    </div>
  );
}
