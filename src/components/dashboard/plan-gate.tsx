import React from "react";
import Link from "next/link";
import { Lock, Sparkles } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PlanTier, isPlanAtLeast, getPlanDisplayName } from "@/lib/feature-gating";

export interface PlanGateProps {
  requiredPlan: PlanTier;
  featureName: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function PlanGate({
  requiredPlan,
  featureName,
  description,
  children,
  className,
}: PlanGateProps) {
  const { user, activeStore } = useAuth();
  const currentPlan = activeStore?.plan || user?.plan || "startup";
  const isUnlocked = isPlanAtLeast(currentPlan, requiredPlan);

  if (isUnlocked) {
    return <>{children}</>;
  }

  return (
    <div className={cn("relative rounded-2xl sm:rounded-3xl overflow-hidden border border-white/10 p-4 sm:p-6 bg-[#111111]", className)}>
      {/* Blurred Children Mock Display */}
      <div className="filter blur-md opacity-25 pointer-events-none select-none">
        {children}
      </div>

      {/* Locked Overlay Card */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/95 to-black flex flex-col items-center justify-center p-4 text-center space-y-2.5 font-body z-20 overflow-hidden">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-maroon-800 to-maroon-950 border border-maroon-600/40 flex items-center justify-center text-maroon-300 shadow-glow shrink-0">
          <Lock className="w-4 h-4" />
        </div>

        <div className="space-y-1 max-w-full px-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-maroon-950/60 border border-maroon-700/50 text-maroon-300 text-[9px] font-mono font-bold uppercase tracking-wider">
            <Sparkles className="w-2.5 h-2.5 text-maroon-400" /> {getPlanDisplayName(requiredPlan)}
          </div>

          <h3 className="text-xs sm:text-sm font-bold font-heading text-white tracking-tight leading-tight">
            {featureName}
          </h3>

          <p className="text-[11px] text-zinc-400 leading-normal max-w-xs line-clamp-2">
            {description || `This feature requires the ${getPlanDisplayName(requiredPlan)}.`}
          </p>
        </div>

        <Link href="/dashboard/billing" className="shrink-0 pt-1">
          <Button
            variant="primary"
            size="sm"
            className="px-4 h-8 text-[10px] uppercase tracking-wider font-bold shadow-glow"
          >
            Upgrade to {getPlanDisplayName(requiredPlan)}
          </Button>
        </Link>
      </div>
    </div>
  );
}
