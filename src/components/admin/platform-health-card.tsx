"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { ShieldCheck, Server, Database, Cpu, Wifi } from "lucide-react";
import { Badge } from "@/components/ui/table";

export function PlatformHealthCard() {
  const metrics = [
    { label: "API Gateway", status: "Optimal", ping: "24ms", icon: Wifi },
    { label: "Database Cluster", status: "Optimal", ping: "12ms", icon: Database },
    { label: "Store Renderer Engine", status: "Optimal", ping: "18ms", icon: Server },
    { label: "AI Creative Pipeline", status: "Optimal", ping: "45ms", icon: Cpu },
  ];

  return (
    <Card className="p-5 space-y-4 bg-[#151515] border-white/10 font-body">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <h4 className="text-xs font-bold font-heading text-white">System Infrastructure & SLA</h4>
        </div>
        <Badge variant="success" className="font-mono text-[10px]">
          99.99% Operational
        </Badge>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {metrics.map((m, i) => {
          const Icon = m.icon;
          return (
            <div key={i} className="p-3 rounded-xl bg-[#111111] border border-white/5 space-y-1">
              <div className="flex items-center justify-between text-zinc-400">
                <Icon className="w-4 h-4 text-maroon-400" />
                <span className="text-[10px] font-mono text-emerald-400 font-semibold">{m.ping}</span>
              </div>
              <p className="text-xs font-bold font-heading text-white pt-1">{m.label}</p>
              <span className="text-[10px] text-zinc-500 font-mono block">{m.status}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
