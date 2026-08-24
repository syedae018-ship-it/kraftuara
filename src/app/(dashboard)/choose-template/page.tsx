"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, ShieldCheck, CheckCircle2, Monitor, Smartphone, Store, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";

const templates = [
  {
    id: "bloom",
    name: "Craft Store Classic",
    tag: "Artisan, Homeware, Boutique & Modern Catalog",
    desc: "Sleek, high-converting light e-commerce layout tailored for boutique storefronts, handcrafted artisan goods, and modern brands.",
    desktopImg: "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?w=1000",
    accent: "from-amber-500/20 to-maroon-900/30",
  }
];

export default function ChooseTemplatePage() {
  const router = useRouter();
  const { selectTemplate } = useAuth();
  const [selected, setSelected] = useState<string>("bloom");

  const handleSelect = (id: string) => {
    selectTemplate(id);
    router.push("/create-store");
  };

  return (
    <div className="min-h-screen bg-[#080808] text-white flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 font-body relative overflow-hidden">
      {/* Subtle Ambient Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-maroon-900/15 blur-[140px] pointer-events-none rounded-full" />

      <div className="relative z-10 w-full max-w-4xl space-y-8 my-8 text-center">
        {/* Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-maroon-800 to-maroon-950 border border-maroon-600/40 text-white shadow-glow mb-2">
            <Store className="w-6 h-6" />
          </div>
          <Badge variant="maroon" className="gap-1 text-[11px] uppercase tracking-wider">
            <Sparkles className="w-3 h-3 text-maroon-300" /> Premium Design Showcase
          </Badge>
          <h1 className="text-2xl sm:text-4xl font-bold font-heading text-white tracking-tight">
            Choose Your Store Template
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 font-body max-w-md mx-auto">
            Select a high-converting storefront theme to start building your WhatsApp catalog.
          </p>
        </div>

        {/* Template Showcase Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {templates.map((tmpl) => {
            const isSelected = selected === tmpl.id;
            return (
              <Card
                key={tmpl.id}
                onClick={() => setSelected(tmpl.id)}
                className={cn(
                  "bg-[#111111] border-white/10 hover:border-maroon-700/50 p-5 space-y-4 transition-all duration-300 group hover:-translate-y-1 text-left relative cursor-pointer",
                  isSelected && "border-maroon-600 shadow-glow"
                )}
              >
                {/* Visual Thumbnail */}
                <div className="aspect-[16/10] w-full rounded-xl overflow-hidden bg-zinc-900 border border-white/5 relative">
                  <img
                    src={tmpl.desktopImg}
                    alt={tmpl.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-maroon-400 font-mono font-bold uppercase tracking-wider block">
                    {tmpl.tag}
                  </span>
                  <h3 className="text-base font-bold font-heading text-white">{tmpl.name} Theme</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed font-body">{tmpl.desc}</p>
                </div>

                <div className="pt-2">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(tmpl.id);
                    }}
                    variant={isSelected ? "primary" : "outline"}
                    className="w-full justify-center text-xs py-2 h-9 font-semibold"
                  >
                    Select {tmpl.name}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Action Footer */}
        <div className="flex items-center justify-center gap-4 pt-4">
          <Button
            onClick={() => handleSelect(selected)}
            variant="primary"
            size="lg"
            className="px-8 shadow-glow"
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Continue setup with {templates.find((t) => t.id === selected)?.name}
          </Button>
        </div>
      </div>
    </div>
  );
}
