"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface QuickActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick?: () => void;
  badge?: string;
  isLoading?: boolean;
  className?: string;
}

export function QuickActionCard({
  title,
  description,
  icon,
  onClick,
  badge,
  isLoading = false,
  className,
}: QuickActionCardProps) {
  if (isLoading) {
    return (
      <div className="bg-[#151515] border border-white/10 rounded-2xl p-5 space-y-3">
        <Skeleton variant="circle" className="w-10 h-10" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    );
  }

  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "group relative flex flex-col justify-between p-5 rounded-2xl bg-[#151515] border border-white/10 text-left transition-all duration-200 hover:border-maroon-700/50 hover:bg-[#181818] hover:shadow-glow w-full",
        className
      )}
    >
      <div className="flex items-start justify-between w-full mb-4">
        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 group-hover:text-maroon-400 group-hover:bg-maroon-950/40 group-hover:border-maroon-700/40 transition-colors">
          {icon}
        </div>
        <div className="flex items-center gap-1.5">
          {badge && (
            <span className="text-[10px] font-semibold font-body uppercase tracking-wider px-2 py-0.5 rounded-full bg-maroon-950/60 text-maroon-300 border border-maroon-700/50">
              {badge}
            </span>
          )}
          <ArrowUpRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
        </div>
      </div>

      <div className="space-y-1">
        <h4 className="text-sm font-semibold font-heading text-white group-hover:text-maroon-300 transition-colors">
          {title}
        </h4>
        <p className="text-xs text-zinc-400 font-body leading-relaxed">
          {description}
        </p>
      </div>
    </motion.button>
  );
}
