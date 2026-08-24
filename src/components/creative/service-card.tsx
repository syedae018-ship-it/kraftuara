"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, Clock, ArrowRight } from "lucide-react";
import { CreativeService } from "@/types/creative";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

export interface ServiceCardProps {
  service: CreativeService;
  className?: string;
}

export function ServiceCard({ service, className }: ServiceCardProps) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      className={cn(
        "group relative bg-[#151515] border border-white/10 rounded-2xl overflow-hidden shadow-card transition-all duration-200 hover:border-white/20 flex flex-col justify-between",
        className
      )}
    >
      {/* Cover Image */}
      <div className="relative aspect-[16/9] w-full bg-[#111111] border-b border-white/5 overflow-hidden flex items-center justify-center">
        <img
          src={service.coverImage}
          alt={service.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        <div className="absolute top-3 left-3 z-10">
          <span className="px-2.5 py-0.5 rounded-full bg-black/70 backdrop-blur-sm border border-white/10 font-heading text-[10px] font-bold text-zinc-300 uppercase tracking-wider">
            {service.category}
          </span>
        </div>
      </div>

      {/* Card Content Body */}
      <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
        <div className="space-y-1.5">
          <h3 className="text-base font-bold font-heading text-white group-hover:text-maroon-300 transition-colors">
            {service.title}
          </h3>
          <p className="text-xs text-zinc-400 font-body line-clamp-2 leading-relaxed">
            {service.description}
          </p>
        </div>

        {/* Pricing & Order Action */}
        <div className="pt-3 border-t border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono text-zinc-500 uppercase block">Starting from</span>
              <span className="text-base font-bold font-heading text-white">{formatCurrency(service.startingPrice)}</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-mono text-zinc-400">
              <Clock className="w-3.5 h-3.5 text-maroon-400" />
              <span>{service.deliveryTime}</span>
            </div>
          </div>

          <Link href={`/dashboard/creative/new?serviceId=${service.id}`}>
            <Button
              variant="primary"
              size="sm"
              className="w-full"
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Order Service
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
