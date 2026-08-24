import React from "react";
import { ProductStatus } from "@/types/product";
import { CategoryStatus } from "@/types/category";
import { CollectionStatus } from "@/types/collection";
import { cn } from "@/lib/utils";

export type AnyStatus = ProductStatus | CategoryStatus | CollectionStatus | "archived";

export interface StatusBadgeProps {
  status: AnyStatus;
  className?: string;
}

const statusConfig: Record<
  AnyStatus,
  { label: string; bg: string; text: string; border: string; dotBg: string }
> = {
  published: {
    label: "Published",
    bg: "bg-emerald-950/60",
    text: "text-emerald-300",
    border: "border-emerald-800/40",
    dotBg: "bg-emerald-400",
  },
  draft: {
    label: "Draft",
    bg: "bg-zinc-800/60",
    text: "text-zinc-300",
    border: "border-zinc-700/50",
    dotBg: "bg-zinc-400",
  },
  out_of_stock: {
    label: "Out of Stock",
    bg: "bg-amber-950/60",
    text: "text-amber-300",
    border: "border-amber-800/40",
    dotBg: "bg-amber-400",
  },
  hidden: {
    label: "Hidden",
    bg: "bg-maroon-950/60",
    text: "text-maroon-300",
    border: "border-maroon-800/50",
    dotBg: "bg-maroon-400",
  },
  archived: {
    label: "Archived",
    bg: "bg-purple-950/60",
    text: "text-purple-300",
    border: "border-purple-800/40",
    dotBg: "bg-purple-400",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.draft;

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
