"use client";

import React from "react";
import { StatCard } from "@/components/dashboard/stat-card";
import { Users, Store, Activity } from "lucide-react";
import { PlatformStats } from "@/types/admin";
import { formatCurrency } from "@/lib/utils";

export function AdminStatCard({ stats }: { stats: PlatformStats }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Total Merchant Users"
        value={stats.totalUsers.toString()}
        subtitle="Registered merchant accounts"
        icon={<Users className="w-4 h-4 text-maroon-400" />}
        variant="maroon"
      />
      <StatCard
        title="Live Stores"
        value={`${stats.liveStores} / ${stats.activeStores}`}
        subtitle="Active merchant storefronts"
        icon={<Store className="w-4 h-4 text-amber-400" />}
      />
      <StatCard
        title="Platform MRR"
        value={formatCurrency(stats.mrr)}
        subtitle="From active subscriptions"
        icon={<span className="text-xs font-bold font-mono text-emerald-400">₹</span>}
      />
      <StatCard
        title="Platform Revenue"
        value={formatCurrency(stats.totalRevenue)}
        subtitle={`${stats.successfulPaymentsCount || 0} successful payments`}
        icon={<Activity className="w-4 h-4 text-emerald-400" />}
      />
    </div>
  );
}
