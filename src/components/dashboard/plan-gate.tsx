"use client";

import React from "react";
import Link from "next/link";
import { Lock, Sparkles, ArrowRight, ShieldAlert } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type RequiredPlanLevel = "Pro Plan" | "Business Plan";

export interface PlanGateProps {
  requiredPlan: RequiredPlanLevel;
  featureName: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

const planHierarchy: Record<string, number> = {
  "Starter Plan": 1,
  "Starter": 1,
  "Pro Plan": 2,
  "Professional": 2,
  "Business Plan": 3,
  "Business": 3,
  "Enterprise Plan": 4,
};

export function PlanGate({
  requiredPlan,
  featureName,
  description,
  children,
  className,
}: PlanGateProps) {
  const { user } = useAuth();

  const userPlanLevel = planHierarchy[user?.plan || "Starter Plan"] || 1;
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
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/90 to-black flex flex-col items-center justify-center p-6 text-center space-y-4 font-body z-20">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-maroon-800 to-maroon-950 border border-maroon-600/40 flex items-center justify-center text-maroon-300 shadow-glow">
          <Lock className="w-6 h-6" />
        </div>

        <div className="space-y-1 max-w-md">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-maroon-950/60 border border-maroon-700/50 text-maroon-300 text-[10px] font-mono font-bold uppercase tracking-wider">
            <Sparkles className="w-3 h-3 text-maroon-400" /> {requiredPlan} Feature
          </div>

          <h3 className="text-xl font-bold font-heading text-white tracking-tight">
            Unlock {featureName}
          </h3>

          <p className="text-xs text-zinc-400 leading-relaxed">
            {description ||
              `Your current plan (${user?.plan || "Starter Plan"}) does not include ${featureName}. Upgrade to the ${requiredPlan} to unlock full access.`}
          </p>
        </div>

        <Link href="/choose-plan">
          <Button
            variant="primary"
            size="md"
            className="px-6 text-xs uppercase tracking-wider font-bold shadow-glow"
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Upgrade Plan to Unlock
          </Button>
        </Link>
      </div>
    </div>
  );
}
