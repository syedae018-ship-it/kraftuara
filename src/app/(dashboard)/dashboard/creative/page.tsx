"use client";

import React from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { SectionTitle } from "@/components/dashboard/section-title";
import { Badge } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, Wand2, Video, Image, Box, ArrowRight, BellRing } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function CreativeHubPage() {
  const upcomingFeatures = [
    {
      icon: Image,
      title: "AI Studio Photography",
      description: "Generate photorealistic lifestyle studio backgrounds for your catalog items in 1-click.",
      tag: "In Development",
    },
    {
      icon: Box,
      title: "3D Product Mockups",
      description: "Interactive 360-degree render generator for luxury packaging and apparel.",
      tag: "Coming Soon",
    },
    {
      icon: Video,
      title: "Viral Reels & Video Promos",
      description: "Auto-generate high-converting Instagram Reels and TikTok videos synced to trending music.",
      tag: "Private Beta",
    },
    {
      icon: Wand2,
      title: "Automated Social Ad Creatives",
      description: "Ready-to-post promotional banners for festive sales, discounts, and brand announcements.",
      tag: "Coming Soon",
    },
  ];

  return (
    <DashboardLayout breadcrumbs={[{ label: "Store Dashboard", href: "/dashboard" }, { label: "Creative Hub" }]}>
      <SectionTitle
        title="Creative Hub & AI Design Studio"
        description="Next-generation visual marketing, AI lifestyle shoots, and promo video generation for e-commerce brands."
        badge={
          <Badge variant="maroon" className="gap-1 font-mono text-[11px]">
            <Sparkles className="w-3 h-3 text-maroon-300" /> Coming Soon
          </Badge>
        }
      />

      <div className="space-y-8 pb-20 max-w-5xl">
        {/* Hero Announcement Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1C1215] via-[#120B0D] to-[#0D0D0D] border border-maroon-800/40 p-8 sm:p-12 text-center shadow-2xl">
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-maroon-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-maroon-900/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-maroon-950/80 border border-maroon-700/50 text-maroon-300 text-xs font-mono">
              <Sparkles className="w-3.5 h-3.5 text-maroon-400" />
              Kraftaura AI Creative Suite
            </div>

            <h2 className="text-2xl sm:text-4xl font-bold font-heading text-white tracking-tight leading-tight">
              Studio-Grade Product Visuals, Powered by AI
            </h2>

            <p className="text-sm text-zinc-400 font-body leading-relaxed max-w-lg mx-auto">
              We are building a unified design studio directly inside your Kraftaura dashboard. Transform simple phone photos into high-converting e-commerce assets in seconds.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                variant="primary"
                onClick={() => toast.success("Notification Enabled", "You'll be notified when Creative Hub launches!")}
                leftIcon={<BellRing className="w-4 h-4" />}
                className="w-full sm:w-auto"
              >
                Notify Me on Launch
              </Button>
            </div>
          </div>
        </div>

        {/* Feature Previews */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold font-heading text-white uppercase tracking-wider">
              Upcoming Studio Capabilities
            </h3>
            <span className="text-xs text-zinc-500 font-mono">Phase 2 Roadmap</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {upcomingFeatures.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <Card key={idx} className="bg-[#111111] border-white/10 p-6 rounded-2xl space-y-3 hover:border-white/20 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-maroon-950/80 border border-maroon-700/40 flex items-center justify-center text-maroon-400">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold bg-white/5 border border-white/10 text-zinc-400">
                      {feat.tag}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold font-heading text-white">{feat.title}</h4>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{feat.description}</p>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
