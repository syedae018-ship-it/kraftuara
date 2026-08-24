"use client";

import React from "react";
import Link from "next/link";
import { CreativeOrder, CreativeStatus } from "@/types/creative";
import { CreativeStatusBadge } from "../status-badge";
import { Badge } from "@/components/ui/table";
import { Sparkles, Calendar, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface KanbanBoardProps {
  orders: CreativeOrder[];
  className?: string;
}

const columns: { id: string; title: string; statuses: CreativeStatus[] }[] = [
  { id: "col-pending", title: "Pending Review", statuses: ["pending"] },
  { id: "col-assigned", title: "Assigned", statuses: ["accepted"] },
  { id: "col-working", title: "In Production", statuses: ["working"] },
  { id: "col-revision", title: "Revision", statuses: ["revision"] },
  { id: "col-delivered", title: "Delivered", statuses: ["delivered", "completed"] },
];

export function KanbanBoard({ orders, className }: KanbanBoardProps) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4", className)}>
      {columns.map((col) => {
        const columnOrders = orders.filter((o) => col.statuses.includes(o.status));

        return (
          <div key={col.id} className="bg-[#111111] border border-white/10 rounded-2xl p-3 space-y-3 min-w-[240px]">
            <div className="flex items-center justify-between px-1 border-b border-white/10 pb-2">
              <h4 className="text-xs font-bold font-heading text-white">{col.title}</h4>
              <span className="w-5 h-5 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-zinc-400 font-bold flex items-center justify-center">
                {columnOrders.length}
              </span>
            </div>

            <div className="space-y-3">
              {columnOrders.length === 0 ? (
                <div className="p-6 text-center text-[11px] text-zinc-600 font-body">No orders</div>
              ) : (
                columnOrders.map((o) => (
                  <div
                    key={o.id}
                    className="p-3 rounded-xl bg-[#151515] border border-white/5 hover:border-white/20 transition-all space-y-2 font-body text-xs group"
                  >
                    <div className="flex items-center justify-between">
                      <Badge variant="maroon" className="font-mono text-[9px] px-1.5 py-0">
                        {o.orderNumber}
                      </Badge>
                      <span className="text-[10px] uppercase font-mono text-zinc-500">{o.priority}</span>
                    </div>

                    <Link href={`/dashboard/creative/orders/${o.id}`}>
                      <h5 className="font-semibold font-heading text-white group-hover:text-maroon-300 transition-colors line-clamp-1">
                        {o.projectTitle}
                      </h5>
                    </Link>
                    <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">{o.requirements}</p>

                    <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                      <span>Target: {new Date(o.expectedDelivery).toLocaleDateString()}</span>
                      <Link href={`/dashboard/creative/orders/${o.id}`} className="hover:text-white">
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
