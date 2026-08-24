"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, BarChart2, Globe, Instagram, MessageSquare, Search as SearchIcon, Share2, HelpCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface ChartDataPoint {
  date: string;
  dayLabel: string;
  views: number;
  visitors: number;
  orders: number;
  revenue: number;
}

export interface AnalyticsCardProps {
  isLoading?: boolean;
  className?: string;
  data?: ChartDataPoint[];
  timeRange: "7D" | "30D" | "90D";
  setTimeRange: (range: "7D" | "30D" | "90D") => void;
}

export function AnalyticsCard({
  isLoading = false,
  className,
  data = [],
  timeRange,
  setTimeRange,
}: AnalyticsCardProps) {
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  if (isLoading) {
    return (
      <Card className="p-6 space-y-4 bg-[#151515] border-white/10">
        <div className="flex justify-between items-center">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-8 w-1/4" />
        </div>
        <Skeleton className="h-48 w-full" />
      </Card>
    );
  }

  const maxViews = Math.max(...data.map((d) => d.views), 1);

  return (
    <Card className={cn("p-6 space-y-6 bg-[#151515] border-white/10", className)}>
      {/* Header with Time Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="text-left">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-maroon-400" />
            <h3 className="text-base font-bold font-heading text-white tracking-tight">
              Store Traffic Trend
            </h3>
          </div>
          <p className="text-xs text-zinc-400 font-body mt-0.5">
            Page views and storefront visitor hits over the selected range.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-[#111111] p-1 rounded-xl border border-white/10 shrink-0">
          {(["7D", "30D", "90D"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={cn(
                "px-3 py-1 text-xs font-semibold font-heading rounded-lg transition-all",
                timeRange === range
                  ? "bg-maroon-800 text-white shadow-sm"
                  : "text-zinc-400 hover:text-white"
              )}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Bar Chart Visualization */}
      <div className="relative pt-6">
        {data.length === 0 ? (
          <div className="h-48 flex flex-col justify-center items-center text-center space-y-2">
            <BarChart2 className="w-8 h-8 text-zinc-600" />
            <span className="text-xs font-heading font-semibold text-zinc-500">No storefront activity yet</span>
            <span className="text-[10px] font-body text-zinc-600">Views will display here as visitors browse your catalog</span>
          </div>
        ) : (
          <div className="h-48 flex items-end justify-between gap-2 sm:gap-4 px-2">
            {data.map((item, index) => {
              const heightPercent = (item.views / maxViews) * 100;
              const isHovered = hoveredBar === index;

              return (
                <div
                  key={item.date}
                  onMouseEnter={() => setHoveredBar(index)}
                  onMouseLeave={() => setHoveredBar(null)}
                  className="flex-1 flex flex-col items-center gap-2 group relative cursor-pointer"
                >
                  {/* Tooltip Hover Overlay */}
                  {isHovered && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute -top-14 z-20 bg-[#111111] border border-maroon-600/50 rounded-lg px-2.5 py-1 shadow-2xl text-center pointer-events-none min-w-[80px]"
                    >
                      <span className="text-[10px] font-mono text-zinc-400 block">{item.dayLabel}</span>
                      <span className="text-xs font-bold text-white block">{item.views.toLocaleString()} Views</span>
                      <span className="text-[9px] font-mono text-maroon-400 block">{item.orders} Orders</span>
                    </motion.div>
                  )}

                  {/* Animated Gradient Bar */}
                  <div className="w-full bg-white/5 rounded-t-xl h-full flex items-end overflow-hidden">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${heightPercent}%` }}
                      transition={{ duration: 0.5, delay: index * 0.02 }}
                      className={cn(
                        "w-full rounded-t-xl transition-all duration-200",
                        isHovered
                          ? "bg-gradient-to-t from-maroon-900 to-maroon-600 shadow-glow"
                          : "bg-gradient-to-t from-maroon-950 via-maroon-800 to-maroon-700/80 group-hover:from-maroon-900 group-hover:to-maroon-600"
                      )}
                    />
                  </div>

                  <span className="text-[10px] font-mono text-zinc-500 group-hover:text-white transition-colors truncate max-w-full">
                    {item.dayLabel}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}

export interface TrafficSourcesCardProps {
  isLoading?: boolean;
  className?: string;
  sources?: Array<{ name: string; percentage: number; count: number }>;
}

export function TrafficSourcesCard({
  isLoading = false,
  className,
  sources = [],
}: TrafficSourcesCardProps) {
  if (isLoading) {
    return (
      <Card className="p-6 space-y-4 bg-[#151515] border-white/10">
        <Skeleton className="h-6 w-1/3" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  const iconMap: Record<string, any> = {
    "Direct Visits": Globe,
    "Instagram Storefront": Instagram,
    "WhatsApp Share": MessageSquare,
    "Google Organic Search": SearchIcon,
    "Referrals & Others": Share2,
  };

  const hasData = sources.some((s) => s.count > 0);

  return (
    <Card className={cn("p-6 space-y-6 bg-[#151515] border-white/10", className)}>
      <div className="text-left">
        <h3 className="text-base font-bold font-heading text-white tracking-tight">
          Traffic Acquisition
        </h3>
        <p className="text-xs text-zinc-400 font-body mt-0.5">
          Top sources driving visitors to your catalog storefront.
        </p>
      </div>

      <div className="space-y-4">
        {!hasData ? (
          <div className="h-44 flex flex-col justify-center items-center text-center space-y-2">
            <Globe className="w-8 h-8 text-zinc-600" />
            <span className="text-xs font-heading font-semibold text-zinc-500">No traffic attribution yet</span>
            <span className="text-[10px] font-body text-zinc-600">Referrals will populate as users click links</span>
          </div>
        ) : (
          sources.map((source) => {
            const Icon = iconMap[source.name] || HelpCircle;
            return (
              <div key={source.name} className="space-y-1.5 text-left">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-zinc-300 font-medium">
                    <Icon className="w-3.5 h-3.5 text-maroon-400" />
                    <span>{source.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500 font-mono text-[11px]">{source.count} views</span>
                    <span className="font-semibold font-mono text-white">{source.percentage}%</span>
                  </div>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${source.percentage}%` }}
                    transition={{ duration: 0.6 }}
                    className="h-full bg-gradient-to-r from-maroon-800 to-maroon-600 rounded-full"
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}
