"use client";

import React, { useState } from "react";
import { CreativeService, CreativeServiceCategory } from "@/types/creative";
import { ServiceCard } from "./service-card";
import { cn } from "@/lib/utils";

export interface ServiceGridProps {
  services: CreativeService[];
  className?: string;
}

const categories: ("All" | CreativeServiceCategory)[] = [
  "All",
  "AI Generation",
  "Design",
  "3D & Mockup",
  "Branding",
  "Video & Animation",
];

export function ServiceGrid({ services, className }: ServiceGridProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const filtered = services.filter(
    (s) => selectedCategory === "All" || s.category === selectedCategory
  );

  return (
    <div className={cn("space-y-6", className)}>
      {/* Category Pills */}
      <div className="flex flex-wrap items-center gap-2 pb-2">
        {categories.map((c) => {
          const isSelected = selectedCategory === c;
          return (
            <button
              key={c}
              type="button"
              onClick={() => setSelectedCategory(c)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-heading font-medium transition-all",
                isSelected
                  ? "bg-maroon-800 text-white shadow-glow border border-maroon-600/50"
                  : "bg-[#151515] border border-white/10 text-zinc-400 hover:text-white hover:border-white/20"
              )}
            >
              {c}
            </button>
          );
        })}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((s) => (
          <ServiceCard key={s.id} service={s} />
        ))}
      </div>
    </div>
  );
}
