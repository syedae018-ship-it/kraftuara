import React from "react";
import { CreativeStatus } from "@/types/creative";
import { cn } from "@/lib/utils";

export interface CreativeStatusBadgeProps {
  status: CreativeStatus;
  className?: string;
}

const statusConfig: Record<
  CreativeStatus,
  { label: string; bg: string; text: string; border: string; dotBg: string }
> = {
  pending: {
    label: "Pending Review",
    bg: "bg-amber-950/60",
    text: "text-amber-300",
    border: "border-amber-800/40",
    dotBg: "bg-amber-400",
  },
  accepted: {
    label: "Order Accepted",
    bg: "bg-zinc-800/60",
    text: "text-zinc-200",
    border: "border-zinc-700/50",
    dotBg: "bg-zinc-300",
  },
  working: {
    label: "In Production",
    bg: "bg-maroon-950/60",
    text: "text-maroon-300",
    border: "border-maroon-800/50",
    dotBg: "bg-maroon-400",
  },
  revision: {
    label: "Under Revision",
    bg: "bg-amber-950/60",
    text: "text-amber-300",
    border: "border-amber-800/50",
    dotBg: "bg-amber-400",
  },
  delivered: {
    label: "Assets Delivered",
    bg: "bg-emerald-950/60",
    text: "text-emerald-300",
    border: "border-emerald-800/40",
    dotBg: "bg-emerald-400",
  },
  completed: {
    label: "Completed",
    bg: "bg-emerald-950/60",
    text: "text-emerald-300",
    border: "border-emerald-800/40",
    dotBg: "bg-emerald-400",
  },
  cancelled: {
    label: "Cancelled",
    bg: "bg-red-950/60",
    text: "text-red-300",
    border: "border-red-800/40",
    dotBg: "bg-red-400",
  },
};

export function CreativeStatusBadge({ status, className }: CreativeStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium font-body border",
        config.bg,
        config.text,
        config.border,
        className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", config.dotBg)} />
      {config.label}
    </span>
  );
}
