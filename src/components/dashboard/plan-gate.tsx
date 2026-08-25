"use client";

import React from "react";
import Link from "next/link";
import { Lock, Sparkles, ArrowRight, ShieldAlert } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type RequiredPlanLevel = "startup" | "growth" | "pro";

export interface PlanGateProps {
  requiredPlan: RequiredPlanLevel;
  featureName: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

const planHierarchy: Record<string, number> = {
  "startup": 1,
  "growth": 2,
  "pro": 3,
};

const planDisplayNames: Record<RequiredPlanLevel, string> = {
  startup: "Startup Pack",
  growth: "Growth Pack",
  pro: "Pro Plan",
};

export function PlanGate({
  requiredPlan,
  featureName,
  description,
  children,
  className,
}: PlanGateProps) {
  const { user } = useAuth();

  const userPlanLevel = planHierarchy[user?.plan || "startup"] || 1;
  const requiredPlanLevel = planHierarchy[requiredPlan] || 2;

  const isUnlocked = userPlanLevel >= requiredPlanLevel;

  if (isUnlocked) {
    return <>{children}</>;
  }

  return (
    <div className={cn("relative rounded-3xl overflow-hidden border border-white/10 p-6 bg-[#111111]", className)}>
      {/* Blurred Children Mock Display */}
      <div className="filter blur-md opacity-25 pointer-events-none select-none">
        {children}
      </div>

      {/* Locked Overlay Card */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/95 to-black flex flex-col items-center justify-center p-3 text-center space-y-2 font-body z-20 overflow-hidden">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-maroon-800 to-maroon-950 border border-maroon-600/40 flex items-center justify-center text-maroon-300 shadow-glow shrink-0">
          <Lock className="w-4 h-4" />
        </div>

        <div className="space-y-0.5 max-w-full px-2">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-maroon-950/60 border border-maroon-700/50 text-maroon-300 text-[8px] font-mono font-bold uppercase tracking-wider">
            <Sparkles className="w-2.5 h-2.5 text-maroon-400" /> {planDisplayNames[requiredPlan]}
          </div>

          <h3 className="text-xs sm:text-sm font-bold font-heading text-white tracking-tight leading-tight">
            {featureName}
          </h3>

          <p className="text-[10px] text-zinc-500 leading-normal max-w-xs line-clamp-1 hidden sm:block">
            {description || `Requires ${requiredPlan}`}
          </p>
        </div>

        <Link href="/choose-plan" className="shrink-0">
          <Button
            variant="primary"
            size="sm"
            className="px-3 h-8 text-[9px] uppercase tracking-wider font-bold shadow-glow"
          >
            Upgrade
          </Button>
        </Link>
      </div>
    </div>
  );
}
