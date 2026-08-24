"use client";

import React from "react";
import { Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function TestimonialsSection({ className }: { className?: string }) {
  const reviews = [
    { name: "Sari A.", rating: 5, quote: "The Royal Amber Oud is intoxicating. Instant WhatsApp ordering made delivery fast." },
    { name: "Khalid M.", rating: 5, quote: "Pure Taif rose attar oil is unmatched in quality. Long lasting scent profile." },
    { name: "Fatima H.", rating: 5, quote: "Beautiful bakhoor incense burner set. The Cambodian agarwood smells heavenly." },
  ];

  return (
    <section className={cn("py-12 px-4 lg:px-8 space-y-6 max-w-7xl mx-auto", className)}>
      <div className="text-center space-y-1">
        <h2 className="text-lg font-bold font-heading text-white tracking-tight">Customer Testimonials</h2>
        <p className="text-xs text-zinc-400 font-body">Verified reviews from catalog buyers</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {reviews.map((r, i) => (
          <Card key={i} className="p-5 bg-[#151515] border-white/10 space-y-3">
            <div className="flex gap-1 text-amber-400">
              {Array.from({ length: r.rating }).map((_, idx) => (
                <Star key={idx} className="w-3.5 h-3.5 fill-current" />
              ))}
            </div>
            <p className="text-xs text-zinc-300 font-body italic leading-relaxed">&quot;{r.quote}&quot;</p>
            <span className="text-[11px] font-bold font-heading text-white block uppercase tracking-wider">— {r.name}</span>
          </Card>
        ))}
      </div>
    </section>
  );
}

export function AboutSection({ storeName }: { storeName: string }) {
  return (
    <section className="py-12 px-4 lg:px-8 bg-[#111111] border-y border-white/10">
      <div className="max-w-3xl mx-auto text-center space-y-3 font-body">
        <span className="text-[10px] font-bold font-heading uppercase tracking-widest text-maroon-400">Our Heritage</span>
        <h2 className="text-2xl font-bold font-heading text-white">About {storeName}</h2>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Crafting bespoke luxury fragrances, pure agarwood extracts, and organic attars. Each blend is matured using traditional methods passed down through generations of master perfumers.
        </p>
      </div>
    </section>
  );
}
