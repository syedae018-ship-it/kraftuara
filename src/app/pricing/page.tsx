import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { getAllPlans } from "@/lib/services/plan-service";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Sparkles, ArrowRight, ShieldCheck, Zap, HelpCircle } from "lucide-react";
import { PricingClientSection } from "./pricing-client-section";

export const metadata: Metadata = {
  title: "Pricing & Plans – Kraftaura Online Store Platform",
  description:
    "Explore transparent SaaS subscription plans for Kraftaura online stores. Start with our Starter Pack or scale with Growth and Pro commerce tiers.",
  alternates: {
    canonical: "https://www.kraftaura.in/pricing",
  },
};

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const plans = await getAllPlans(false);

  return (
    <div className="min-h-screen bg-[#080808] text-white font-body selection:bg-maroon-800 selection:text-white flex flex-col justify-between relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-maroon-900/15 blur-[180px] pointer-events-none rounded-full" />

      <LandingNavbar />

      <main className="pt-32 pb-24 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto w-full relative z-10 space-y-16">
        {/* Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <Badge variant="maroon" className="gap-1.5 py-1 px-3 text-xs uppercase tracking-wider font-mono">
            <Sparkles className="w-3.5 h-3.5 text-maroon-300" />
            Simple &amp; Transparent Pricing
          </Badge>
          <h1 className="text-4xl sm:text-6xl font-extrabold font-heading tracking-tight text-white">
            Plans built for Indian entrepreneurs
          </h1>
          <p className="text-sm sm:text-base text-zinc-400 font-body leading-relaxed">
            No hidden charges, no surprise fees. Choose the tier that matches your catalog scale and upgrade anytime.
          </p>
        </div>

        {/* Dynamic Client Pricing Grid with Monthly/Annual toggle */}
        <PricingClientSection plans={plans} />

        {/* Trust Badges */}
        <div className="flex flex-wrap items-center justify-center gap-8 text-xs sm:text-sm text-zinc-400 font-mono pt-8 border-t border-white/5">
          <span className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Cancel or switch plans anytime
          </span>
          <span className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-400" /> Instant activation &amp; live store setup
          </span>
          <span className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-emerald-400" /> Dedicated 24/7 WhatsApp support
          </span>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-10 bg-[#080808] text-center text-xs text-zinc-500 font-body">
        <p>&copy; {new Date().getFullYear()} Kraftaura Platform. All rights reserved.</p>
      </footer>
    </div>
  );
}
