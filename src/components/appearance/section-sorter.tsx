"use client";

import React from "react";
import { HomepageSectionConfig } from "@/types/theme";
import { ArrowUp, ArrowDown, Eye, EyeOff, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SectionSorterProps {
  sections: HomepageSectionConfig[];
  onChange: (updated: HomepageSectionConfig[]) => void;
  className?: string;
}

export function SectionSorter({ sections, onChange, className }: SectionSorterProps) {
  const sorted = [...sections].sort((a, b) => a.order - b.order);

  const toggleSection = (id: string) => {
    const updated = sections.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s));
    onChange(updated);
  };

  const moveSection = (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= sorted.length) return;

    const list = [...sorted];
    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;

    const reordered = list.map((item, i) => ({ ...item, order: i + 1 }));
    onChange(reordered);
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div>
        <label className="text-xs font-semibold text-zinc-300 font-heading tracking-wide block">
          Homepage Section Builder ({sections.filter((s) => s.enabled).length}/{sections.length} active)
        </label>
        <span className="text-[11px] text-zinc-500 font-body">
          Toggle section visibility and reorder layout hierarchy.
        </span>
      </div>

      <div className="bg-[#111111] border border-white/10 rounded-2xl p-2 space-y-1.5 max-h-72 overflow-y-auto">
        {sorted.map((sec, idx) => (
          <div
            key={sec.id}
            className={cn(
              "flex items-center justify-between p-2.5 rounded-xl border transition-all",
              sec.enabled
                ? "bg-[#151515] border-white/10 text-white"
                : "bg-[#151515]/40 border-white/5 text-zinc-500 opacity-60"
            )}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <GripVertical className="w-4 h-4 text-zinc-600 shrink-0" />
              <span className="text-xs font-medium font-heading truncate">{sec.title}</span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => moveSection(idx, "up")}
                disabled={idx === 0}
                className="p-1 rounded text-zinc-400 hover:text-white disabled:opacity-30"
                title="Move Up"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => moveSection(idx, "down")}
                disabled={idx === sorted.length - 1}
                className="p-1 rounded text-zinc-400 hover:text-white disabled:opacity-30"
                title="Move Down"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => toggleSection(sec.id)}
                className={cn(
                  "p-1.5 rounded-lg transition-colors ml-1",
                  sec.enabled
                    ? "bg-maroon-950/60 text-maroon-300 hover:bg-maroon-800 hover:text-white"
                    : "bg-white/5 text-zinc-500 hover:text-white"
                )}
                title={sec.enabled ? "Disable section" : "Enable section"}
              >
                {sec.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
