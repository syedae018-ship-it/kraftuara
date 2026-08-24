"use client";

import React, { useState, useEffect } from "react";
import { TimelineEvent } from "@/types/creative-mvp";
import { creativeMVPRepository } from "@/lib/repositories/creative-mvp-repository";
import { Card } from "@/components/ui/card";
import { formatRelativeTime } from "@/lib/utils";
import { Clock, CheckCircle2, AlertCircle, FileText, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function Timeline({ orderId, className }: { orderId: string; className?: string }) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);

  useEffect(() => {
    async function loadTimeline() {
      const list = await creativeMVPRepository.getTimeline(orderId);
      setEvents(list);
    }
    loadTimeline();
  }, [orderId]);

  return (
    <Card className={cn("p-5 space-y-4 bg-[#151515] border-white/10 font-body", className)}>
      <div className="flex items-center gap-2 border-b border-white/10 pb-3">
        <Clock className="w-4 h-4 text-maroon-400" />
        <h4 className="text-xs font-bold font-heading text-white">Activity Log & Audit Trail</h4>
      </div>

      <div className="relative pl-5 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-white/10">
        {events.map((e) => (
          <div key={e.id} className="relative flex items-start gap-2.5">
            <div className="absolute -left-5 top-0.5 w-4 h-4 rounded-full bg-[#111111] border border-white/20 flex items-center justify-center text-[10px] text-maroon-400">
              <CheckCircle2 className="w-3 h-3" />
            </div>
            <div>
              <h5 className="text-xs font-bold font-heading text-white">{e.title}</h5>
              <p className="text-[11px] text-zinc-400 leading-relaxed">{e.description}</p>
              <span className="text-[10px] font-mono text-zinc-500">{formatRelativeTime(e.timestamp)}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
