"use client";

import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface StatCardProps {
  title: string;
  value: string | number;
  delta?: {
    value: string;
    isPositive?: boolean;
    isNeutral?: boolean;
  };
  subtitle?: string;
  icon?: React.ReactNode;
  variant?: "default" | "maroon";
  isLoading?: boolean;
  className?: string;
}

export function StatCard({
  title,
  value,
  delta,
  subtitle,
  icon,
  variant = "default",
  isLoading = false,
  className,
}: StatCardProps) {
  if (isLoading) {
    return (
      <Card className="space-y-3 p-5">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton variant="circle" className="w-8 h-8 shrink-0" />
        </div>
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-3 w-1/4" />
      </Card>
    );
  }

  return (
    <Card
      hoverEffect
      className={cn(
        "relative p-5 space-y-3 transition-all duration-200 overflow-hidden group",
        variant === "maroon"
          ? "bg-gradient-to-br from-maroon-950/70 via-[#151515] to-[#151515] border-maroon-700/40 shadow-glow"
          : "bg-[#151515] border-white/10 hover:border-white/20",
        className
      )}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold font-heading text-zinc-400 tracking-wide">
          {title}
        </span>
        {icon && (
          <div
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border transition-colors",
              variant === "maroon"
                ? "bg-maroon-800/80 border-maroon-600/50 text-white"
                : "bg-white/5 border-white/10 text-zinc-400 group-hover:text-white"
            )}
          >
            {icon}
          </div>
        )}
      </div>

      {/* Value & Delta */}
      <div className="space-y-1">
        <div className="text-2xl sm:text-3xl font-bold font-heading text-white tracking-tight">
          {value}
        </div>
        <div className="flex items-center gap-2">
          {delta && (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-[11px] font-semibold font-body px-1.5 py-0.5 rounded-md border",
                delta.isNeutral
                  ? "bg-zinc-800/60 text-zinc-400 border-zinc-700/50"
                  : delta.isPositive
                  ? "bg-emerald-950/60 text-emerald-400 border-emerald-800/50"
                  : "bg-maroon-950/60 text-maroon-300 border-maroon-700/50"
              )}
            >
              {delta.isNeutral ? (
                <Minus className="w-3 h-3" />
              ) : delta.isPositive ? (
                <TrendingUp className="w-3 h-3 text-emerald-400" />
              ) : (
                <TrendingDown className="w-3 h-3 text-maroon-400" />
              )}
              {delta.value}
            </span>
          )}
          {subtitle && (
            <span className="text-xs text-zinc-500 font-body">{subtitle}</span>
          )}
        </div>
      </div>
    </Card>
  );
}
