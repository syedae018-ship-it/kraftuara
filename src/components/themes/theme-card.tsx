"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Theme } from "@/types/theme";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/table";
import { Sparkles, Eye, Check, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ThemeCardProps {
  theme: Theme;
  onApplyTheme: (id: string) => void;
  onPreviewTheme: (theme: Theme) => void;
  className?: string;
}

export function ThemeCard({ theme, onApplyTheme, onPreviewTheme, className }: ThemeCardProps) {
  const isActive = theme.status === "active";

  return (
    <motion.div
      whileHover={{ y: -3 }}
      className={cn(
        "group relative bg-[#151515] border rounded-2xl overflow-hidden shadow-card transition-all duration-200 flex flex-col justify-between",
        isActive ? "border-maroon-500 shadow-glow bg-[#181818]" : "border-white/10 hover:border-white/20",
        className
      )}
    >
      {/* Thumbnail & Badges */}
      <div className="relative aspect-[16/10] w-full bg-[#111111] border-b border-white/5 overflow-hidden flex items-center justify-center">
        <img
          src={theme.thumbnail}
          alt={theme.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
          {isActive ? (
            <Badge variant="maroon" className="gap-1 font-mono text-[10px] bg-maroon-800 text-white border-maroon-600">
              <CheckCircle2 className="w-3 h-3 text-white" /> Active Theme
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-black/70 backdrop-blur-sm border-white/10 font-mono text-[10px]">
              v{theme.version}
            </Badge>
          )}
        </div>
      </div>

      {/* Card Content Body */}
      <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{theme.author}</span>
          </div>
          <h3 className="text-base font-bold font-heading text-white">{theme.name}</h3>
          <p className="text-xs text-zinc-400 font-body line-clamp-2 leading-relaxed">{theme.description}</p>
        </div>

        {/* Feature Badges */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {theme.supportsHero && <span className="text-[9px] px-2 py-0.5 rounded bg-white/5 text-zinc-400 font-mono">Hero Banner</span>}
          {theme.supportsCollections && <span className="text-[9px] px-2 py-0.5 rounded bg-white/5 text-zinc-400 font-mono">Collections</span>}
          {theme.supportsTestimonials && <span className="text-[9px] px-2 py-0.5 rounded bg-white/5 text-zinc-400 font-mono">Reviews</span>}
        </div>

        {/* Card Footer Actions */}
        <div className="pt-3 border-t border-white/5 flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onPreviewTheme(theme)}
            leftIcon={<Eye className="w-3.5 h-3.5" />}
          >
            Preview
          </Button>

          <Button
            variant={isActive ? "secondary" : "primary"}
            size="sm"
            className="flex-1"
            disabled={isActive}
            onClick={() => onApplyTheme(theme.id)}
            leftIcon={isActive ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Sparkles className="w-3.5 h-3.5" />}
          >
            {isActive ? "Active" : "Apply Theme"}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
