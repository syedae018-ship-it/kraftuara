"use client";

import React from "react";
import { ShoppingBag, Package, Palette, Sparkles, User, CheckCircle2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatRelativeTime } from "@/lib/utils";

export type ActivityItem = {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: "order" | "product" | "theme" | "creative" | "user";
};

const defaultActivities: ActivityItem[] = [
  {
    id: "act-1",
    title: "New Catalog Order Received",
    description: "Customer placed an order for Velvet Oud Perfume ($140.00)",
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    type: "order",
  },
  {
    id: "act-2",
    title: "Catalog Theme Updated",
    description: "Primary accent color changed to Deep Maroon (#800020)",
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    type: "theme",
  },
  {
    id: "act-3",
    title: "Creative Banner Requested",
    description: "Ordered 3 promotional social banners for Eid Collection",
    timestamp: new Date(Date.now() - 1000 * 60 * 600).toISOString(),
    type: "creative",
  },
  {
    id: "act-4",
    title: "Category Created",
    description: "Added new category 'Attar Oils' with 8 items",
    timestamp: new Date(Date.now() - 1000 * 60 * 1440).toISOString(),
    type: "product",
  },
];

const iconMap = {
  order: <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />,
  product: <Package className="w-3.5 h-3.5 text-zinc-300" />,
  theme: <Palette className="w-3.5 h-3.5 text-maroon-400" />,
  creative: <Sparkles className="w-3.5 h-3.5 text-amber-400" />,
  user: <User className="w-3.5 h-3.5 text-zinc-400" />,
};

export interface ActivityTimelineProps {
  activities?: ActivityItem[];
  isLoading?: boolean;
  className?: string;
}

export function ActivityTimeline({
  activities = defaultActivities,
  isLoading = false,
  className,
}: ActivityTimelineProps) {
  if (isLoading) {
    return (
      <Card className="p-6 space-y-4">
        <Skeleton className="h-6 w-1/3" />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton variant="circle" className="w-8 h-8 shrink-0" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn("p-6 space-y-6 bg-[#151515] border-white/10", className)}>
      <div>
        <h3 className="text-base font-bold font-heading text-white tracking-tight">
          Recent Activity Timeline
        </h3>
        <p className="text-xs text-zinc-400 font-body mt-0.5">
          Real-time updates across catalog orders, products, and store settings.
        </p>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-px before:bg-white/10">
        {activities.map((item) => (
          <div key={item.id} className="relative flex items-start gap-3 group">
            {/* Timeline Circle Badge */}
            <div className="absolute -left-6 top-0.5 w-7 h-7 rounded-full bg-[#111111] border border-white/10 flex items-center justify-center shrink-0 z-10 group-hover:border-maroon-600 transition-colors">
              {iconMap[item.type]}
            </div>

            <div className="flex-1 space-y-0.5 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-semibold font-heading text-white truncate">
                  {item.title}
                </h4>
                <span className="text-[10px] font-mono text-zinc-500 shrink-0">
                  {formatRelativeTime(item.timestamp)}
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-body leading-relaxed">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
