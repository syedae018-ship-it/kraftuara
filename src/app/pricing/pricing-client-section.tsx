"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PlanConfig } from "@/lib/feature-gating";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PricingClientSectionProps {
  plans: PlanConfig[];
}

export function PricingClientSection({ plans }: PricingClientSectionProps) {
  const [billingInterval, setBillingInterval] = useState<"monthly" | "annual">("monthly");

  return (
    <div className="space-y-10">
      {/* Billing Interval Toggle */}
      <div className="flex justify-center">
        <div className="bg-[#111111] p-1.5 rounded-2xl border border-white/10 flex items-center gap-1 shadow-xl">
          <button
            onClick={() => setBillingInterval("monthly")}
            className={cn(
              "px-6 py-2.5 rounded-xl text-xs sm:text-sm font-heading font-semibold transition-all",
              billingInterval === "monthly"
                ? "bg-maroon-800 text-white shadow-glow"
                : "text-zinc-400 hover:text-white"
            )}
          >
            Monthly Billing
          </button>
          <button
            onClick={() => setBillingInterval("annual")}
            className={cn(
              "px-6 py-2.5 rounded-xl text-xs sm:text-sm font-heading font-semibold transition-all",
              billingInterval === "annual"
                ? "bg-maroon-800 text-white shadow-glow"
                : "text-zinc-400 hover:text-white"
            )}
          >
            Annual Billing
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
        {plans.map((p) => {
          const isAnnual = billingInterval === "annual";
          const displayPrice = isAnnual
            ? `₹${p.priceAnnual.toLocaleString("en-IN")}`
            : `₹${p.priceMonthly.toLocaleString("en-IN")}`;
          const periodLabel = isAnnual ? "year" : "month";
          const isPopular = p.popular;

          return (
            <div
              key={p.id}
              className={cn(
                "relative rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 border text-left backdrop-blur-xl shadow-2xl",
                isPopular
                  ? "bg-[#141414] border-maroon-600 shadow-glow ring-1 ring-maroon-500/40"
                  : "bg-[#111111]/90 border-white/10 hover:border-white/20"
              )}
            >
              {p.badge && (
                <div
                  className={cn(
                    "absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[9px] uppercase font-mono font-bold tracking-widest text-white shadow-md border",
                    isPopular
                      ? "bg-maroon-800 border-maroon-500"
                      : "bg-white/10 border-white/20 text-zinc-300"
                  )}
                >
                  {p.badge}
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold font-heading uppercase tracking-wide text-white">
                    {p.name}
                  </h3>
                  <div className="flex items-baseline gap-1 mt-3">
                    <span className="text-3xl font-extrabold font-heading text-white">{displayPrice}</span>
                    <span className="text-xs text-zinc-500 font-mono">/{periodLabel}</span>
                  </div>
                  {isAnnual && (
                    <p className="text-[11px] text-emerald-400 font-mono mt-1 font-semibold">
                      (Equivalent to ₹{Math.round(p.priceAnnual / 12)}/mo)
                    </p>
                  )}
                  <p className="text-xs text-zinc-400 mt-2.5 font-body leading-relaxed">{p.description}</p>
                </div>

                <div className="space-y-2.5 border-t border-white/10 pt-4">
                  {p.featuresDisplay.map((feat: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-zinc-300 font-body">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="leading-snug">{feat}</span>
                    </div>
                  ))}
                </div>

                <div className="text-[10px] text-zinc-400 font-body text-center bg-white/5 p-2.5 rounded-xl border border-white/5">
                  {p.isTrialEligible ? "🎁 Includes a 3-Day Free Trial" : "⚡ Direct Activation (No trial period)"}
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-white/10">
                <Link href={`/signup?plan=${p.id}&interval=${billingInterval}`} className="w-full">
                  <Button
                    variant={isPopular ? "primary" : "outline"}
                    className={cn(
                      "w-full justify-center h-11 text-xs font-semibold uppercase tracking-wider",
                      isPopular ? "shadow-glow" : "border-white/10 hover:bg-white/5"
                    )}
                    rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  >
                    Choose {p.name}
                  </Button>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
