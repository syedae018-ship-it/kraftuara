"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sparkles, MessageSquare, ArrowRight } from "lucide-react";
import { StoreData } from "@/lib/repositories/storefront-repository";
import { cn } from "@/lib/utils";

export interface HeroSectionProps {
  store: StoreData;
  className?: string;
}

export function HeroSection({ store, className }: HeroSectionProps) {
  const { branding, colors } = store.appearance;

  return (
    <section className={cn("relative py-12 lg:py-20 px-4 lg:px-8 overflow-hidden", className)}>
      {/* Background Image / Glow */}
      {branding.heroBannerUrl && (
        <div className="absolute inset-0 z-0 opacity-20">
          <img src={branding.heroBannerUrl} alt="Hero Banner" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#080808]/80 via-[#080808]/90 to-[#080808]" />
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 max-w-3xl mx-auto text-center space-y-6"
      >
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-maroon-950/80 border border-maroon-600/40 text-[11px] font-bold font-heading text-maroon-300 uppercase tracking-widest">
          <Sparkles className="w-3.5 h-3.5 text-maroon-400" /> Handcrafted Catalog
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold font-heading text-white tracking-tight leading-tight">
          {branding.tagline || branding.name}
        </h1>

        <p className="text-sm sm:text-base text-zinc-300 font-body leading-relaxed max-w-xl mx-auto">
          {branding.description || "Explore our luxury collection of pure Cambodian agarwood, distilled rose attars, and handcrafted incense burners."}
        </p>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href={`#products`}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-maroon-800 hover:bg-maroon-700 text-white font-bold font-heading text-sm transition-all shadow-glow flex items-center justify-center gap-2 border border-maroon-600/40"
          >
            Shop Collection <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </motion.div>
    </section>
  );
}
