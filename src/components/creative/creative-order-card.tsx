"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CreativeOrder } from "@/types/creative";
import { CreativeStatusBadge } from "./status-badge";
import { Badge } from "@/components/ui/table";
import { Sparkles, Calendar, ArrowRight, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CreativeOrderCardProps {
  order: CreativeOrder;
  className?: string;
}

export function CreativeOrderCard({ order, className }: CreativeOrderCardProps) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={cn(
        "group relative bg-[#151515] border border-white/10 rounded-2xl p-5 shadow-card transition-all duration-200 hover:border-white/20 space-y-4",
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <Badge variant="maroon" className="font-mono text-[11px] bg-maroon-800 text-white">
            {order.orderNumber}
          </Badge>
          <span className="text-xs font-semibold font-heading text-white">{order.serviceTitle}</span>
        </div>
        <CreativeStatusBadge status={order.status} />
      </div>

      <div className="space-y-1">
        <Link href={`/dashboard/creative/orders/${order.id}`}>
          <h4 className="text-base font-bold font-heading text-white group-hover:text-maroon-300 transition-colors line-clamp-1">
            {order.projectTitle}
          </h4>
        </Link>
        <p className="text-xs text-zinc-400 font-body line-clamp-2 leading-relaxed">
          {order.requirements}
        </p>
      </div>

      <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs font-body">
        <div className="flex items-center gap-3 text-zinc-400">
          <span className="flex items-center gap-1 text-[11px] font-mono">
            <Calendar className="w-3.5 h-3.5 text-maroon-400" />
            Target: {new Date(order.expectedDelivery).toLocaleDateString()}
          </span>
          {order.attachments.length > 0 && (
            <span className="flex items-center gap-1 text-[11px] font-mono text-zinc-500">
              <Paperclip className="w-3.5 h-3.5" /> {order.attachments.length} files
            </span>
          )}
        </div>

        <Link
          href={`/dashboard/creative/orders/${order.id}`}
          className="inline-flex items-center gap-1 text-xs font-medium text-maroon-400 hover:text-white transition-colors"
        >
          View Details <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </motion.div>
  );
}
