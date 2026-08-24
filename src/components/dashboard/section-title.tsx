import React from "react";
import { cn } from "@/lib/utils";

export interface SectionTitleProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
}

export function SectionTitle({
  title,
  description,
  action,
  badge,
  className,
}: SectionTitleProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10 mb-6", className)}>
      <div className="space-y-0.5">
        <div className="flex items-center gap-2.5">
          <h2 className="text-base font-bold font-heading text-white tracking-tight">
            {title}
          </h2>
          {badge}
        </div>
        {description && (
          <p className="text-xs text-zinc-400 font-body">{description}</p>
        )}
      </div>
      {action && <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto shrink-0">{action}</div>}
    </div>
  );
}
