"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { TrendingUp, Users, Store, DollarSign } from "lucide-react";

export function AnalyticsChart() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-body">
      {/* MRR Revenue Growth Visualizer */}
      <Card className="p-6 space-y-4 bg-[#151515] border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <h4 className="text-sm font-bold font-heading text-white">Platform MRR & Revenue Growth</h4>
          </div>
          <span className="text-xs font-mono text-emerald-400 font-bold">+24.5%</span>
        </div>

        {/* SVG Sparkline Graph */}
        <div className="h-44 w-full flex items-end justify-between gap-2 pt-4 px-2">
          {[35, 45, 52, 68, 74, 88, 95, 110, 124].map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
              <div
                style={{ height: `${h}%` }}
                className="w-full bg-gradient-to-t from-maroon-950 via-maroon-800 to-maroon-600 rounded-t-lg group-hover:brightness-125 transition-all"
              />
              <span className="text-[9px] font-mono text-zinc-500">M{i + 1}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Merchant Stores & User Acquisition */}
      <Card className="p-6 space-y-4 bg-[#151515] border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-maroon-400" />
            <h4 className="text-sm font-bold font-heading text-white">Merchant Stores & User Growth</h4>
          </div>
          <span className="text-xs font-mono text-maroon-300 font-bold">+148 Merchants</span>
        </div>

        <div className="h-44 w-full flex items-end justify-between gap-2 pt-4 px-2">
          {[20, 32, 45, 60, 78, 92, 112, 130, 148].map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
              <div
                style={{ height: `${(h / 150) * 100}%` }}
                className="w-full bg-gradient-to-t from-zinc-900 via-zinc-700 to-zinc-400 rounded-t-lg group-hover:brightness-125 transition-all"
              />
              <span className="text-[9px] font-mono text-zinc-500">M{i + 1}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
