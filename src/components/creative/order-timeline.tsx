"use client";

import React from "react";
import { CreativeStatus } from "@/types/creative";
import { CheckCircle2, Clock, Sparkles, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface OrderTimelineProps {
  status: CreativeStatus;
  createdAt: string;
  expectedDelivery: string;
  className?: string;
}

const steps: { id: CreativeStatus; title: string; desc: string }[] = [
  { id: "pending", title: "Order Placed", desc: "Submitted & awaiting designer review." },
  { id: "accepted", title: "Accepted", desc: "Designer assigned to brief." },
  { id: "working", title: "In Production", desc: "Crafting digital creative assets." },
  { id: "delivered", title: "Assets Delivered", desc: "High-resolution renders uploaded." },
  { id: "completed", title: "Order Completed", desc: "Approved & finalized." },
];

export function OrderTimeline({ status, createdAt, expectedDelivery, className }: OrderTimelineProps) {
  const getStepIndex = (st: CreativeStatus) => {
    if (st === "cancelled") return -1;
    if (st === "revision") return 2;
    return steps.findIndex((s) => s.id === st);
  };

  const currentIndex = getStepIndex(status);

  return (
    <div className={cn("space-y-4 font-body", className)}>
      <div className="flex items-center justify-between text-xs border-b border-white/10 pb-3">
        <span className="text-zinc-400">
          Created: <strong className="text-white font-mono">{new Date(createdAt).toLocaleDateString()}</strong>
        </span>
        <span className="text-zinc-400">
          Target Delivery: <strong className="text-maroon-300 font-mono">{new Date(expectedDelivery).toLocaleDateString()}</strong>
        </span>
      </div>

      {status === "cancelled" ? (
        <div className="p-4 rounded-xl bg-red-950/30 border border-red-800/40 text-red-300 flex items-center gap-2 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>This creative request order has been cancelled.</span>
        </div>
      ) : (
        <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-px before:bg-white/10">
          {steps.map((step, idx) => {
            const isDone = idx <= currentIndex;
            const isCurrent = idx === currentIndex;

            return (
              <div key={step.id} className="relative flex items-start gap-3">
                <div
                  className={cn(
                    "absolute -left-6 top-0.5 w-5 h-5 rounded-full border flex items-center justify-center text-[10px] shrink-0 font-mono",
                    isDone
                      ? "bg-maroon-800 border-maroon-600 text-white"
                      : "bg-[#111111] border-white/20 text-zinc-500"
                  )}
                >
                  {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                </div>

                <div>
                  <h5 className={cn("text-xs font-bold font-heading", isCurrent ? "text-maroon-300" : isDone ? "text-white" : "text-zinc-500")}>
                    {step.title}
                  </h5>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
