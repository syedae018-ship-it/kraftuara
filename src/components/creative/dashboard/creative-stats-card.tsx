"use client";

import React from "react";
import { StatCard } from "@/components/dashboard/stat-card";
import { ShoppingBag, Clock, Sparkles, CheckCircle2, DollarSign, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function CreativeStatsCard({ className }: { className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4", className)}>
      <StatCard
        title="Total Orders"
        value="14"
        delta={{ value: "+4 this week", isPositive: true }}
        subtitle="Submitted briefs"
        icon={<ShoppingBag className="w-4 h-4" />}
      />
      <StatCard
        title="In Production"
        value="5 Active"
        delta={{ value: "2 high priority", isPositive: true }}
        subtitle="Working & Revisions"
        icon={<Sparkles className="w-4 h-4 text-maroon-400" />}
        variant="maroon"
      />
      <StatCard
        title="Delivered"
        value="8 Completed"
        delta={{ value: "98% on-time", isPositive: true }}
        subtitle="Digital assets"
        icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}
      />
      <StatCard
        title="Creative Volume"
        value="$1,840.00"
        delta={{ value: "+15.2% growth", isPositive: true }}
        subtitle="Gross order value"
        icon={<DollarSign className="w-4 h-4" />}
      />
    </div>
  );
}
